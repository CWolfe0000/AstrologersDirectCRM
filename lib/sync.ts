"use client";

import { useStore, type DemoState } from "./store";
import { api, ApiError } from "./api";

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
 * reading a notification, editing one's own name); everything else is
 * read-only and never sent.
 */

const COLLECTIONS = [
  "people", "clients", "charts", "observations", "consultations", "tasks",
  "readings", "recordings", "files", "notifications", "activity", "portalNotifications",
] as const;
type Coll = (typeof COLLECTIONS)[number];
type Rec = { id: string } & Record<string, unknown>;

type Op =
  | { kind: "put"; coll: Coll; rec: Rec }
  | { kind: "delete"; coll: Coll; id: string }
  | { kind: "settings" }
  | { kind: "portal"; path: string; method: "POST" | "PUT"; body?: unknown };

let applyingRemote = false;
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
    case "put":
      return api(`/api/v1/records/${op.coll}/${encodeURIComponent(op.rec.id)}`, { method: "PUT", body: op.rec });
    case "delete":
      return api(`/api/v1/records/${op.coll}/${encodeURIComponent(op.id)}`, { method: "DELETE" });
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

function diff(coll: Coll, next: Rec[], prev: Rec[], view: "app" | "portal") {
  const before = new Map(prev.map((r) => [r.id, r]));
  const seen = new Set<string>();
  for (const rec of next) {
    seen.add(rec.id);
    const old = before.get(rec.id);
    if (old === rec) continue;
    if (view === "app") {
      enqueue(`${coll}:${rec.id}`, { kind: "put", coll, rec });
    } else {
      // Portal: translate the few permitted changes into their dedicated endpoints.
      if (coll === "readings" && rec.notification === "opened" && old?.notification !== "opened")
        enqueue(`opened:${rec.id}`, { kind: "portal", method: "POST", path: `/api/v1/portal/readings/${encodeURIComponent(rec.id)}/opened` });
      if (coll === "portalNotifications" && rec.read && !old?.read)
        enqueue(`read:${rec.id}`, { kind: "portal", method: "POST", path: `/api/v1/portal/notifications/${encodeURIComponent(rec.id)}/read` });
      if (coll === "people" && rec.id === useStore.getState().portalClientId && (rec.firstName !== old?.firstName || rec.lastName !== old?.lastName))
        enqueue(`profile`, { kind: "portal", method: "PUT", path: "/api/v1/portal/profile", body: { firstName: rec.firstName, lastName: rec.lastName } });
    }
  }
  if (view === "app") for (const id of before.keys()) if (!seen.has(id)) enqueue(`${coll}:${id}`, { kind: "delete", coll, id });
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
  view: "app" | "portal";
  user: NonNullable<DemoState["session"]["user"]>;
  practice?: { id: string; name: string };
  portalClientId?: string;
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
    useStore.setState({
      ...patch,
      portalClientId: data.portalClientId ?? st.portalClientId,
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
