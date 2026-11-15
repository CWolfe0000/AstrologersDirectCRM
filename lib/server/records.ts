import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
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
  const t = RECORD_TABLES[collection];
  const where = opts?.clientIds ? and(eq(t.practiceId, practiceId), inArray(t.clientId, opts.clientIds)) : eq(t.practiceId, practiceId);
  const rows = await db().select({ data: t.data, sealed: t.sealed }).from(t).where(where);
  return rows.map(join);
}

export async function getRecord(practiceId: string, collection: Collection, id: string) {
  const t = RECORD_TABLES[collection];
  const [row] = await db().select({ data: t.data, sealed: t.sealed }).from(t).where(and(eq(t.practiceId, practiceId), eq(t.id, id)));
  return row ? join(row) : null;
}

/** Validate, encrypt and upsert. The record id is scoped to the practice. */
export async function upsertRecord(practiceId: string, collection: Collection, value: unknown) {
  const rec = validate(collection, value);
  const t = RECORD_TABLES[collection];
  const { data, sealed } = split(collection, rec);
  const clientId = clientIdOf(collection, rec);
  await db()
    .insert(t)
    .values({ practiceId, id: rec.id as string, clientId, data, sealed })
    .onConflictDoUpdate({ target: [t.practiceId, t.id], set: { clientId, data, sealed, updatedAt: sql`now()` } });
  return rec;
}

export async function deleteRecord(practiceId: string, collection: Collection, id: string) {
  const t = RECORD_TABLES[collection];
  await db().delete(t).where(and(eq(t.practiceId, practiceId), eq(t.id, id)));
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
