import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { Home, Person, PersonData, PersonKind } from "@/lib/people";
import { db, schema } from "./db";
import { newId, seal, unseal } from "./crypto";

export const MAX_PEOPLE = 40;

export async function listPeople(userId: string): Promise<Person[]> {
  const rows = await db().select().from(schema.people).where(eq(schema.people.userId, userId)).orderBy(asc(schema.people.createdAt));
  return rows.map((r) => ({ id: r.id, kind: r.kind, ...unseal<PersonData>(r.sealed) }));
}

export async function getPerson(userId: string, id: string): Promise<Person | null> {
  const [r] = await db().select().from(schema.people).where(and(eq(schema.people.userId, userId), eq(schema.people.id, id)));
  return r ? { id: r.id, kind: r.kind, ...unseal<PersonData>(r.sealed) } : null;
}

/** Creates a person, or replaces one the member owns. A member has at most one "self". */
export async function savePerson(userId: string, kind: PersonKind, data: PersonData, id?: string) {
  const existing = await db().select({ id: schema.people.id, kind: schema.people.kind }).from(schema.people).where(eq(schema.people.userId, userId));
  const target = id ?? (kind === "self" ? existing.find((p) => p.kind === "self")?.id : undefined);
  if (target) {
    // A person can move between past partner and current or new; nobody moves into or out of "self".
    const was = existing.find((p) => p.id === target)?.kind;
    if (!was || (was === "self") !== (kind === "self")) throw new Error("Not found");
    // The form does not carry where the member lives: keep it.
    if (kind === "self" && data.home === undefined) data = { ...data, home: (await getPerson(userId, target))?.home ?? null };
    await db().update(schema.people).set({ kind, sealed: seal(data) }).where(and(eq(schema.people.userId, userId), eq(schema.people.id, target)));
    return target;
  }
  if (existing.length >= MAX_PEOPLE) throw new Error(`You can save up to ${MAX_PEOPLE} people.`);
  const newPersonId = newId("p");
  await db().insert(schema.people).values({ id: newPersonId, userId, kind, sealed: seal(data) });
  return newPersonId;
}

export async function deletePerson(userId: string, id: string) {
  await db().delete(schema.people).where(and(eq(schema.people.userId, userId), eq(schema.people.id, id)));
}

/** Where the member lives now (kept with their own details). */
export async function saveHome(userId: string, home: Home) {
  const self = (await listPeople(userId)).find((p) => p.kind === "self");
  if (!self) throw new Error("Add your birth details first.");
  const { id, kind, ...data } = self;
  void kind;
  await db().update(schema.people).set({ sealed: seal({ ...data, home }) }).where(and(eq(schema.people.userId, userId), eq(schema.people.id, id)));
}
