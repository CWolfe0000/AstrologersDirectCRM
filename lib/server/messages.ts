import "server-only";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { newId, seal, unseal } from "./crypto";
import { HttpError } from "./http";
import { getRecord, getSettings, listCollection, upsertRecord } from "./records";
import { clientUserFor, scope } from "./clientaccess";
import { link, sendMail } from "./mail";

export type Sender = "practitioner" | "client";
export interface Message { id: string; from: Sender; body: string; at: string; readAt: string | null }

const MAX = 5000;
/** A second email for the same conversation is held back while the first is still unread, for this long. */
const EMAIL_QUIET_MS = 20 * 60_000;

const t = () => schema.messages;
const toMessage = (r: typeof schema.messages.$inferSelect): Message => ({
  id: r.id,
  from: r.sender as Sender,
  body: unseal<{ body: string }>(r.sealed).body,
  at: r.createdAt.toISOString(),
  readAt: r.readAt?.toISOString() ?? null,
});

/** One conversation (oldest first). */
export async function thread(practiceId: string, clientId: string): Promise<Message[]> {
  const rows = await db().select().from(t()).where(and(eq(t().practiceId, practiceId), eq(t().clientId, clientId))).orderBy(asc(t().createdAt));
  return rows.map(toMessage);
}

/** The practice's conversations: last message and unread count (from the client) per client. */
export async function inbox(practiceId: string) {
  const rows = await db()
    .select({
      clientId: t().clientId,
      last: sql<Date>`max(${t().createdAt})`,
      unread: sql<number>`count(*) filter (where ${t().sender} = 'client' and ${t().readAt} is null)`,
    })
    .from(t())
    .where(eq(t().practiceId, practiceId))
    .groupBy(t().clientId)
    .orderBy(desc(sql`max(${t().createdAt})`));
  const out = [];
  for (const r of rows) {
    const [lastRow] = await db().select().from(t()).where(and(eq(t().practiceId, practiceId), eq(t().clientId, r.clientId))).orderBy(desc(t().createdAt)).limit(1);
    out.push({ clientId: r.clientId, at: new Date(r.last).toISOString(), unread: Number(r.unread), last: lastRow ? toMessage(lastRow) : null });
  }
  return out;
}

export async function unreadCount(practiceId: string, reader: Sender, clientId?: string) {
  const other: Sender = reader === "practitioner" ? "client" : "practitioner";
  const [r] = await db()
    .select({ n: sql<number>`count(*)` })
    .from(t())
    .where(and(eq(t().practiceId, practiceId), eq(t().sender, other), isNull(t().readAt), ...(clientId ? [eq(t().clientId, clientId)] : [])));
  return Number(r?.n ?? 0);
}

/** Mark everything the other side sent in a conversation as read. */
export async function markRead(practiceId: string, clientId: string, reader: Sender) {
  const other: Sender = reader === "practitioner" ? "client" : "practitioner";
  await db().update(t()).set({ readAt: new Date() }).where(and(eq(t().practiceId, practiceId), eq(t().clientId, clientId), eq(t().sender, other), isNull(t().readAt)));
}

/** Send a message, then tell the other side in the app and (unless one is already waiting unread) by email. */
export async function send(practiceId: string, clientId: string, from: Sender, raw: unknown): Promise<Message> {
  const body = typeof raw === "string" ? raw.trim() : "";
  if (!body) throw new HttpError(422, "Write a message first.");
  if (body.length > MAX) throw new HttpError(422, `Messages can be up to ${MAX.toLocaleString()} characters.`);
  const person = await getRecord(practiceId, "people", clientId);
  const client = await getRecord(practiceId, "clients", clientId);
  if (!person || !client) throw new HttpError(404, "Client not found.");

  // Was there already an unread message from this sender recently? Then don't email again.
  const [recent] = await db()
    .select({ id: t().id })
    .from(t())
    .where(and(eq(t().practiceId, practiceId), eq(t().clientId, clientId), eq(t().sender, from), isNull(t().readAt), gt(t().createdAt, new Date(Date.now() - EMAIL_QUIET_MS))))
    .limit(1);

  const row = { id: newId("msg"), practiceId, clientId, sender: from, sealed: seal({ body }) };
  const [saved] = await db().insert(t()).values(row).returning();
  const msg = toMessage(saved!);

  const settings = await getSettings(practiceId);
  const pr = (settings?.practitioner ?? {}) as { name?: string; firstName?: string; email?: string; practice?: string };
  const astrologer = pr.name ?? "Your astrologer";
  const first = String(person.firstName ?? "Your client");
  const preview = body.length > 280 ? `${body.slice(0, 277)}…` : body;
  const at = new Date().toISOString().slice(0, 19);

  if (from === "practitioner") {
    const u = await clientUserFor(practiceId, clientId);
    if (u) {
      await upsertRecord(practiceId, "portalNotifications", { id: newId("pn"), clientId, title: `New Message From ${pr.firstName ?? astrologer}`, body: preview.slice(0, 200), at, read: false, href: "/portal/messages" });
      if (!recent && u.emailVerifiedAt)
        await sendMail(u.email, `New Message From ${astrologer}`, `Hi ${first},\n\n${astrologer} sent you a message:\n\n${preview}\n\nRead and reply in your client portal:\n${link(`/portal/messages?practice=${encodeURIComponent(practiceId)}`)}\n`);
    }
  } else {
    await upsertRecord(practiceId, "notifications", { id: newId("n"), type: "client", title: "New Message", body: `${first} ${String(person.lastName ?? "")}`.trim() + `: ${preview.slice(0, 160)}`, at, read: false, href: `/app/messages?client=${encodeURIComponent(clientId)}` });
    if (!recent) {
      const to = pr.email?.includes("@") ? pr.email : (await ownerEmail(practiceId));
      if (to) await sendMail(to, `New Message From ${first}`, `${first} ${String(person.lastName ?? "")}`.trim() + ` sent you a message:\n\n${preview}\n\nReply in AstrologersDirect:\n${link(`/app/messages?client=${encodeURIComponent(clientId)}`)}\n`);
    }
  }
  return msg;
}

async function ownerEmail(practiceId: string) {
  const [u] = await db().select({ email: schema.users.email }).from(schema.users).where(and(eq(schema.users.practiceId, practiceId), eq(schema.users.role, "owner"))).limit(1);
  return u?.email ?? null;
}

/** When a client record is deleted, its conversation goes too. */
export async function deleteThread(practiceId: string, clientId: string) {
  await db().delete(t()).where(and(eq(t().practiceId, practiceId), eq(t().clientId, clientId)));
}
export async function deleteAllMessages(practiceId: string) {
  await db().delete(t()).where(eq(t().practiceId, practiceId));
}

/** Names for an inbox (people records are encrypted per practice). */
export async function clientNames(practiceId: string) {
  const people = await listCollection(practiceId, "people");
  return Object.fromEntries(people.map((p) => [String(p.id), `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()]));
}

export { scope };
