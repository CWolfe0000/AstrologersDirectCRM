"use client";

import { useStore, type DemoState } from "./store";
import { api, ApiError } from "./api";
import { registerEngine } from "./astro";
import { SwissApiEngine } from "./astro/swiss-client";

/**
 * Server sync for the practice store.
 *
 * Screens keep using the store exactly as before. After `bootstrap()` loads the
 * signed-in practice, every change to a collection is diffed (records are
 * immutable, so a changed reference means a changed record) and saved to the
 * API in the background: PUT for new/changed records, DELETE for removed ones.
 * Failed saves are retried; persistent failures are surfaced to the user.
 *
 * In the client portal only a few changes are allowed (opening a reading,
 * reading a notification, editing one's own name, responding to shared work); everything else is
 * read-only and never sent.
 */

const COLLECTIONS = [
  "people", "clients", "charts", "observations", "consultations", "tasks",
  "readings", "recordings", "files", "notifications", "activity", "portalNotifications",
  "clientWork", "workResponses",
] as const;
type Coll = (typeof COLLECTIONS)[number];
type Rec = { id: string } & Record<string, unknown>;

type Op =
  | { kind: "put"; coll: Coll; rec: Rec }
  | { kind: "delete"; coll: Coll; id: string }
  | { kind: "settings" }
  | { kind: "portal"; path: string; method: "POST" | "PUT"; body?: unknown };

let applyingRemote = false;
/** Server version of each record ("coll:id" → version), for edit-conflict protection. */
const versions = new Map<string, number>();
/** Server timestamp up to which this device has seen other devices' changes. */
let cursor: string | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;
const queue = new Map<string, Op>();
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

function setSync(patch: Partial<DemoState["sync"]>) {
  useStore.setState((s) => ({ sync: { ...s.sync, ...patch } }));
}

function enqueue(key: string, op: Op) {
  queue.set(key, op);
  setSync({ pending: queue.size });
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 350);
}

async function send(op: Op) {
  switch (op.kind) {
    case "put": {
      const key = `${op.coll}:${op.rec.id}`;
      const r = await api<{ version: number }>(`/api/v1/records/${op.coll}/${encodeURIComponent(op.rec.id)}`, {
        method: "PUT",
        body: op.rec,
        headers: { "x-base-version": String(versions.get(key) ?? 0) },
      });
      versions.set(key, r.version);
      return r;
    }
    case "delete": {
      const r = await api(`/api/v1/records/${op.coll}/${encodeURIComponent(op.id)}`, { method: "DELETE" });
      versions.delete(`${op.coll}:${op.id}`);
      return r;
    }
    case "settings": {
      const s = useStore.getState();
      return api("/api/v1/settings", { method: "PUT", body: { practitioner: s.practitioner, defaults: s.defaults } });
    }
    case "portal":
      return api(op.path, { method: op.method, body: op.body ?? {} });
  }
}

async function flush() {
  timer = null;
  if (flushing) return;
  flushing = true;
  try {
    while (queue.size) {
      const [key, op] = queue.entries().next().value as [string, Op];
      let attempt = 0;
      for (;;) {
        try {
          await send(op);
          break;
        } catch (e) {
          const err = e as ApiError;
          if (err.status === 401) {
            window.location.href = `/auth/login?next=${encodeURIComponent(location.pathname)}`;
            return;
          }
          if (err.status === 409 && op.kind === "put") {
            await resolveConflict(op, err.details as { current: Rec | null; version: number });
            break;
          }
          // Validation / permission errors won't succeed on retry.
          if ((err.status >= 400 && err.status < 500) || ++attempt >= 4) {
            useStore.getState().toast("A change couldn’t be saved", err.message, "error");
            setSync({ error: err.message });
            break;
          }
          await new Promise((r) => setTimeout(r, 600 * 2 ** attempt));
        }
      }
      // Only drop the entry if it wasn't replaced by a newer change meanwhile.
      if (queue.get(key) === op) queue.delete(key);
      setSync({ pending: queue.size, savedAt: new Date().toISOString() });
    }
    setSync({ error: null });
  } finally {
    flushing = false;
  }
}

/**
 * Another device saved this record first. The newer saved version wins on
 * screen. For observations nothing is lost: this device's text is kept as a
 * revision on the saved version.
 */
async function resolveConflict(op: Extract<Op, { kind: "put" }>, d: { current: Rec | null; version: number }) {
  const key = `${op.coll}:${op.rec.id}`;
  const st = useStore.getState();
  if (!d.current) {
    // Deleted elsewhere: don't resurrect it silently.
    versions.delete(key);
    applyRemote(() => useStore.setState({ [op.coll]: (st[op.coll] as unknown as Rec[]).filter((r) => r.id !== op.rec.id) } as never));
    st.toast("That item was deleted on another device", "Your change wasn’t saved.", "error");
    return;
  }
  versions.set(key, d.version);
  let merged = d.current;
  if (op.coll === "observations" && op.rec.body !== d.current.body) {
    const revisions = Array.isArray(d.current.revisions) ? (d.current.revisions as unknown[]) : [];
    merged = {
      ...d.current,
      revisions: [...revisions, { at: new Date().toISOString().slice(0, 19), summary: "Edit from another device, kept here so nothing is lost", body: op.rec.body }],
    };
    enqueue(key, { kind: "put", coll: op.coll, rec: merged });
    st.toast("This observation was also edited on another device", "The newest version is shown; your text is saved in its revision history.");
  } else {
    st.toast("This was changed on another device", "The latest version is shown. Make your change again if it’s still needed.");
  }
  applyRemote(() => useStore.setState({ [op.coll]: (useStore.getState()[op.coll] as unknown as Rec[]).map((r) => (r.id === merged.id ? merged : r)) } as never));
}

function applyRemote(fn: () => void) {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
}

/** Pull other devices' changes (only when nothing local is waiting to be saved). */
export async function pullChanges() {
  const st = useStore.getState();
  if (!cursor || st.session.status !== "ready" || st.session.view !== "app" || queue.size || flushing) return;
  let r: { cursor: string; upserts: Record<string, { record: Rec; version: number }[]>; deletes: { collection: string; id: string }[] };
  try {
    r = await api(`/api/v1/changes?since=${encodeURIComponent(cursor)}`);
  } catch {
    return;
  }
  if (queue.size || flushing) return; // a local edit started meanwhile; try next time
  cursor = r.cursor;
  const patch: Record<string, Rec[]> = {};
  const cur = useStore.getState();
  for (const [coll, rows] of Object.entries(r.upserts)) {
    if (!(COLLECTIONS as readonly string[]).includes(coll)) continue;
    let list = [...(cur[coll as Coll] as unknown as Rec[])];
    for (const { record, version } of rows) {
      const key = `${coll}:${record.id}`;
      if ((versions.get(key) ?? 0) >= version) continue; // already have it (e.g. our own save)
      versions.set(key, version);
      const i = list.findIndex((x) => x.id === record.id);
      if (i >= 0) list[i] = record;
      else list = [record, ...list];
    }
    patch[coll] = list;
  }
  for (const { collection, id } of r.deletes) {
    if (!(COLLECTIONS as readonly string[]).includes(collection)) continue;
    versions.delete(`${collection}:${id}`);
    patch[collection] = (patch[collection] ?? (cur[collection as Coll] as unknown as Rec[])).filter((x) => x.id !== id);
  }
  if (Object.keys(patch).length) applyRemote(() => useStore.setState(patch as never));
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") void pullChanges();
  }, 60_000);
  window.addEventListener("focus", () => void pullChanges());
}

function diff(coll: Coll, next: Rec[], prev: Rec[], view: "app" | "portal") {
  const before = new Map(prev.map((r) => [r.id, r]));
  const seen = new Set<string>();
  for (const rec of next) {
    seen.add(rec.id);
    const old = before.get(rec.id);
    if (old === rec) continue;
    if (view === "app") {
      // Client responses are the client's own: practitioners read them but never write them.
      if (coll !== "workResponses") enqueue(`${coll}:${rec.id}`, { kind: "put", coll, rec });
    } else {
      if (coll === "workResponses" && !old) {
        const { workId, ...r } = rec as Rec & { workId: string };
        enqueue(`response:${rec.id}`, { kind: "portal", method: "POST", path: `/api/v1/portal/work/${encodeURIComponent(workId)}/responses`, body: { ...r, workId } });
      }
      // Portal: translate the few permitted changes into their dedicated endpoints.
      if (coll === "readings" && rec.notification === "opened" && old?.notification !== "opened")
        enqueue(`opened:${rec.id}`, { kind: "portal", method: "POST", path: `/api/v1/portal/readings/${encodeURIComponent(rec.id)}/opened` });
      if (coll === "portalNotifications" && rec.read && !old?.read)
        enqueue(`read:${rec.id}`, { kind: "portal", method: "POST", path: `/api/v1/portal/notifications/${encodeURIComponent(rec.id)}/read` });
      if (coll === "people" && rec.id === useStore.getState().portalClientId && (rec.firstName !== old?.firstName || rec.lastName !== old?.lastName))
        enqueue(`profile`, { kind: "portal", method: "PUT", path: "/api/v1/portal/profile", body: { firstName: rec.firstName, lastName: rec.lastName } });
    }
  }
  if (view === "app" && coll !== "workResponses") for (const id of before.keys()) if (!seen.has(id)) enqueue(`${coll}:${id}`, { kind: "delete", coll, id });
}

function watch() {
  unsubscribe?.();
  unsubscribe = useStore.subscribe((state, prev) => {
    if (applyingRemote || state.session.status !== "ready") return;
    const view = state.session.view ?? "app";
    for (const c of COLLECTIONS) {
      if (state[c] !== prev[c]) diff(c, state[c] as unknown as Rec[], prev[c] as unknown as Rec[], view);
    }
    if (view === "app" && (state.practitioner !== prev.practitioner || state.defaults !== prev.defaults)) enqueue("settings", { kind: "settings" });
  });
}

type BootstrapResponse = Partial<DemoState> & {
  versions?: Record<string, Record<string, number>>;
  cursor?: string;
  view: "app" | "portal";
  user: NonNullable<DemoState["session"]["user"]>;
  practice?: { id: string; name: string };
  portalClientId?: string;
  practices?: DemoState["portalPractices"];
  preview?: boolean;
};

/** Load the signed-in practice (or client portal view) into the store. */
export async function bootstrap(view: "app" | "portal", opts: { as?: string | null } = {}) {
  const st = useStore.getState();
  if (st.session.status === "loading") return;
  useStore.setState({ session: { status: "loading", view } });
  try {
    const qs = new URLSearchParams({ view });
    if (opts.as) qs.set("as", opts.as);
    const data = await api<BootstrapResponse>(`/api/v1/bootstrap?${qs}`);
    applyingRemote = true;
    const patch: Partial<DemoState> = {};
    for (const c of COLLECTIONS) (patch as Record<string, unknown>)[c] = (data as Record<string, unknown>)[c] ?? [];
    if (data.practitioner) patch.practitioner = data.practitioner;
    if (data.defaults) patch.defaults = data.defaults;
    if (data.view === "app") patch.plan = data.plan === "premium" ? "premium" : "standard";
    versions.clear();
    for (const [coll, byId] of Object.entries(data.versions ?? {})) for (const [id, v] of Object.entries(byId)) versions.set(`${coll}:${id}`, v);
    cursor = data.cursor ?? null;
    useStore.setState({
      ...patch,
      portalClientId: data.portalClientId ?? st.portalClientId,
      portalPractices: data.view === "portal" ? (data.practices ?? []) : [],
      session: { status: "ready", view: data.view, user: data.user, practice: data.practice, preview: data.preview },
      sync: { pending: 0, error: null },
    });
  } catch (e) {
    const err = e as ApiError;
    useStore.setState({ session: { status: "error", view, error: { status: err.status ?? 0, message: err.message } } });
  } finally {
    applyingRemote = false;
  }
  watch();
  if (view === "app") {
    // Real calculations for practitioners (Swiss Ephemeris on the server).
    registerEngine(SwissApiEngine, true);
    startPolling();
  }
}

/** Save anything pending immediately (e.g. before navigating away). */
export function flushNow() {
  if (timer) clearTimeout(timer);
  return flush();
}

export function hasPendingChanges() {
  return queue.size > 0 || flushing;
}

export async function signOut() {
  await flushNow().catch(() => {});
  await api("/api/auth/logout", { body: {} }).catch(() => {});
  unsubscribe?.();
  window.location.href = "/auth/login";
}

/** Server mode: add the demonstration practice's sample records, then reload. */
export async function loadSampleData() {
  await api("/api/v1/sample-data", { body: {} });
  useStore.setState({ session: { status: "idle" } });
  await bootstrap("app");
}
