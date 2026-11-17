import "server-only";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { RECORD_TABLES, type Collection } from "./db/schema";
import { seal, unseal } from "./crypto";
import { COLLECTION_SCHEMAS } from "./validation";

export const COLLECTIONS = Object.keys(RECORD_TABLES) as Collection[];

/**
 * Fields encrypted at rest, per collection. Everything else lives in the
 * plain `data` column. Names stay plain so they can be listed and searched;
 * birth data, contact details, notes, observation text and messages do not.
 */
export const SEALED_FIELDS: Record<Collection, string[]> = {
  people: ["birth", "notes"],
  clients: ["email", "phone", "summary"],
  charts: [],
  observations: ["body", "revisions"],
  consultations: ["prepNotes", "sessionNotes", "sharedSummary"],
  tasks: ["description"],
  readings: ["message"],
  recordings: [],
  files: ["note"],
  notifications: [],
  activity: [],
  portalNotifications: [],
  clientWork: ["instructions"],
  workResponses: ["text"],
};

/** Which field links a record to a client (for indexing / portal filtering). */
function clientIdOf(collection: Collection, rec: Record<string, unknown>): string | null {
  if (collection === "clients") return rec.id as string;
  if (collection === "people") return (rec.clientId as string) ?? (rec.id as string);
  return (rec.clientId as string) ?? null;
}

export function isCollection(x: string): x is Collection {
  return (COLLECTIONS as string[]).includes(x);
}

/** A save was based on an older version of the record. */
export class ConflictError extends Error {
  constructor(public current: Record<string, unknown> | null, public version: number) {
    super("This was changed on another device.");
  }
}

export class ValidationError extends Error {
  constructor(public issues: unknown) {
    super("Invalid record");
  }
}

export function validate(collection: Collection, value: unknown) {
  const r = COLLECTION_SCHEMAS[collection].safeParse(value);
  if (!r.success) throw new ValidationError(r.error.flatten());
  return r.data as Record<string, unknown>;
}

function split(collection: Collection, rec: Record<string, unknown>) {
  const sealedKeys = SEALED_FIELDS[collection];
  const data: Record<string, unknown> = {};
  const secret: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (v === undefined) continue;
    if (sealedKeys.includes(k)) secret[k] = v;
    else data[k] = v;
  }
  return { data, sealed: Object.keys(secret).length ? seal(secret) : null };
}

function join(row: { data: unknown; sealed: string | null }) {
  const base = row.data as Record<string, unknown>;
  return row.sealed ? { ...base, ...unseal<Record<string, unknown>>(row.sealed) } : base;
}

export async function listCollection(practiceId: string, collection: Collection, opts?: { clientIds?: string[] }) {
  return (await listWithVersions(practiceId, collection, opts)).map((r) => r.record);
}

export async function listWithVersions(practiceId: string, collection: Collection, opts?: { clientIds?: string[]; since?: Date }) {
  const t = RECORD_TABLES[collection];
  const conds = [eq(t.practiceId, practiceId)];
  if (opts?.clientIds) conds.push(inArray(t.clientId, opts.clientIds));
  if (opts?.since) conds.push(gt(t.updatedAt, opts.since));
  const rows = await db().select({ data: t.data, sealed: t.sealed, version: t.version }).from(t).where(and(...conds));
  return rows.map((r) => ({ record: join(r), version: r.version }));
}

export async function getRecord(practiceId: string, collection: Collection, id: string) {
  const t = RECORD_TABLES[collection];
  const [row] = await db().select({ data: t.data, sealed: t.sealed }).from(t).where(and(eq(t.practiceId, practiceId), eq(t.id, id)));
  return row ? join(row) : null;
}

/**
 * Validate, encrypt and upsert. The record id is scoped to the practice.
 * With `baseVersion`, the save only succeeds if the stored record is still at
 * that version (0 = must not exist yet); otherwise a ConflictError carries the
 * current record. Returns the record and its new version.
 */
export async function upsertRecord(practiceId: string, collection: Collection, value: unknown, opts?: { baseVersion?: number }) {
  const rec = validate(collection, value);
  const t = RECORD_TABLES[collection];
  const { data, sealed } = split(collection, rec);
  const clientId = clientIdOf(collection, rec);
  const id = rec.id as string;
  const base = opts?.baseVersion;
  const rows = await db()
    .insert(t)
    .values({ practiceId, id, clientId, data, sealed, version: 1 })
    .onConflictDoUpdate({
      target: [t.practiceId, t.id],
      set: { clientId, data, sealed, version: sql`${t.version} + 1`, updatedAt: sql`now()` },
      // A create (base 0) never overwrites; an update must match the stored version.
      setWhere: base === undefined ? undefined : base === 0 ? sql`false` : eq(t.version, base),
    })
    .returning({ version: t.version });
  if (!rows.length) {
    const [cur] = await db().select({ data: t.data, sealed: t.sealed, version: t.version }).from(t).where(and(eq(t.practiceId, practiceId), eq(t.id, id)));
    throw new ConflictError(cur ? join(cur) : null, cur?.version ?? 0);
  }
  if (base === 0 || base === undefined) {
    await db().delete(schema.tombstones).where(and(eq(schema.tombstones.practiceId, practiceId), eq(schema.tombstones.collection, collection), eq(schema.tombstones.id, id)));
  }
  return { ...rec, __version: rows[0]!.version } as Record<string, unknown> & { __version: number };
}

export async function deleteRecord(practiceId: string, collection: Collection, id: string) {
  const t = RECORD_TABLES[collection];
  const gone = await db().delete(t).where(and(eq(t.practiceId, practiceId), eq(t.id, id))).returning({ id: t.id });
  if (gone.length) {
    await db()
      .insert(schema.tombstones)
      .values({ practiceId, collection, id })
      .onConflictDoUpdate({ target: [schema.tombstones.practiceId, schema.tombstones.collection, schema.tombstones.id], set: { deletedAt: sql`now()` } });
  }
}

/** Everything changed or deleted since a server timestamp (for other open devices). */
export async function changesSince(practiceId: string, since: Date) {
  const upserts: Record<string, { record: Record<string, unknown>; version: number }[]> = {};
  for (const c of COLLECTIONS) {
    const rows = await listWithVersions(practiceId, c, { since });
    if (rows.length) upserts[c] = rows;
  }
  const deletes = await db()
    .select({ collection: schema.tombstones.collection, id: schema.tombstones.id })
    .from(schema.tombstones)
    .where(and(eq(schema.tombstones.practiceId, practiceId), gt(schema.tombstones.deletedAt, since)));
  return { upserts, deletes };
}

// ——— Observation history ———————————————————————————————————————————————
const SNAPSHOT_WINDOW_MS = 10 * 60_000;
const MAX_SNAPSHOTS = 200;

/** Keep the observation text on the server: one snapshot per 10 minutes of editing. */
export async function snapshotObservation(practiceId: string, observationId: string, title: string, body: string) {
  const s = schema.observationSnapshots;
  const [latest] = await db()
    .select()
    .from(s)
    .where(and(eq(s.practiceId, practiceId), eq(s.observationId, observationId)))
    .orderBy(desc(s.createdAt))
    .limit(1);
  const sealedBody = seal({ title, body });
  if (latest && Date.now() - latest.createdAt.getTime() < SNAPSHOT_WINDOW_MS) {
    await db().update(s).set({ sealed: sealedBody, updatedAt: sql`now()` }).where(eq(s.id, latest.id));
    return;
  }
  await db().insert(s).values({ id: `snp_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`, practiceId, observationId, sealed: sealedBody });
  // Trim the oldest beyond the cap.
  await db().execute(sql`delete from observation_snapshots where id in (
    select id from observation_snapshots where practice_id = ${practiceId} and observation_id = ${observationId}
    order by created_at desc offset ${MAX_SNAPSHOTS})`);
}

export async function listSnapshots(practiceId: string, observationId: string) {
  const s = schema.observationSnapshots;
  const rows = await db()
    .select()
    .from(s)
    .where(and(eq(s.practiceId, practiceId), eq(s.observationId, observationId)))
    .orderBy(desc(s.createdAt));
  return rows.map((r) => ({ id: r.id, at: r.updatedAt.toISOString(), startedAt: r.createdAt.toISOString(), ...unseal<{ title: string; body: string }>(r.sealed) }));
}

export async function serverNow() {
  const r = await db().execute(sql`select now() as now`);
  return new Date((r.rows[0] as { now: string | Date }).now);
}

export async function deleteAllRecords(practiceId: string) {
  for (const c of COLLECTIONS) {
    const t = RECORD_TABLES[c];
    await db().delete(t).where(eq(t.practiceId, practiceId));
  }
}

export async function getSettings(practiceId: string) {
  const [row] = await db().select().from(schema.practiceSettings).where(eq(schema.practiceSettings.practiceId, practiceId));
  return row ?? null;
}

export async function putSettings(practiceId: string, practitioner: unknown, defaults: unknown) {
  await db()
    .insert(schema.practiceSettings)
    .values({ practiceId, practitioner, defaults })
    .onConflictDoUpdate({ target: schema.practiceSettings.practiceId, set: { practitioner, defaults, updatedAt: sql`now()` } });
}

/** Is a stored file still referenced by any reading, file or recording (other than the one given)? */
export async function isFileReferenced(practiceId: string, key: string, except?: { collection: Collection; id: string }) {
  for (const c of ["readings", "files", "recordings"] as const) {
    const t = RECORD_TABLES[c];
    const rows = await db()
      .select({ id: t.id })
      .from(t)
      .where(and(eq(t.practiceId, practiceId), sql`${t.data}->>'fileKey' = ${key}`));
    if (rows.some((r) => !(except && except.collection === c && except.id === r.id))) return true;
  }
  return false;
}
