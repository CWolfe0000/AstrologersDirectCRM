import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "./db";
import { HttpError } from "./http";
import type { SessionUser } from "./auth";

/**
 * One portal per client: a client login can be linked to several practices.
 * In the portal every record id is "scoped" with its practice so ids from
 * different practices never collide: `${practiceId}~${recordId}`.
 */
export const SEP = "~";
export const scope = (practiceId: string, id: string) => `${practiceId}${SEP}${id}`;

export async function linksFor(userId: string) {
  return db().select().from(schema.clientAccess).where(eq(schema.clientAccess.userId, userId)).orderBy(schema.clientAccess.createdAt);
}

/** Resolve a scoped id from the portal to (practice, client, record id), checking the signed-in client may use it. */
export async function resolveScoped(user: SessionUser, scopedId: string) {
  if (user.role !== "client") throw new HttpError(403, "Not allowed.");
  const links = await linksFor(user.id);
  const i = scopedId.lastIndexOf(SEP);
  const practiceId = i > 0 ? scopedId.slice(0, i) : links.length === 1 ? links[0]!.practiceId : "";
  const id = i > 0 ? scopedId.slice(i + 1) : scopedId;
  const link = links.find((l) => l.practiceId === practiceId);
  if (!link || !id) throw new HttpError(404, "Not found.");
  return { practiceId, clientId: link.clientId, id };
}

/** The client login linked to a practice's client record, if any. */
export async function clientUserFor(practiceId: string, clientId: string) {
  const [row] = await db()
    .select({ u: schema.users })
    .from(schema.clientAccess)
    .innerJoin(schema.users, eq(schema.users.id, schema.clientAccess.userId))
    .where(and(eq(schema.clientAccess.practiceId, practiceId), eq(schema.clientAccess.clientId, clientId)));
  return row?.u ?? null;
}

/**
 * A practice stops giving a client portal access (access turned off, client
 * archived or deleted). The login keeps its other practices; with none left it
 * is removed, which also ends its sessions.
 */
export async function removeClientAccess(practiceId: string, clientId: string) {
  const affected = await db()
    .delete(schema.clientAccess)
    .where(and(eq(schema.clientAccess.practiceId, practiceId), eq(schema.clientAccess.clientId, clientId)))
    .returning({ userId: schema.clientAccess.userId });
  for (const { userId } of affected) await settleUser(userId, practiceId);
}

/** Before a practice is deleted: clients who also see other astrologers keep their login. */
export async function releasePracticeClients(practiceId: string) {
  const affected = await db().delete(schema.clientAccess).where(eq(schema.clientAccess.practiceId, practiceId)).returning({ userId: schema.clientAccess.userId });
  for (const { userId } of affected) await settleUser(userId, practiceId);
}

async function settleUser(userId: string, leftPracticeId: string) {
  const [other] = await db().select().from(schema.clientAccess).where(and(eq(schema.clientAccess.userId, userId), ne(schema.clientAccess.practiceId, leftPracticeId))).limit(1);
  if (!other) {
    await db().delete(schema.users).where(and(eq(schema.users.id, userId), eq(schema.users.role, "client")));
    return;
  }
  // Move the login's "home" to a practice it still belongs to, so deleting the old practice can't remove it.
  await db()
    .update(schema.users)
    .set({ practiceId: other.practiceId, clientId: other.clientId })
    .where(and(eq(schema.users.id, userId), eq(schema.users.practiceId, leftPracticeId)));
}
