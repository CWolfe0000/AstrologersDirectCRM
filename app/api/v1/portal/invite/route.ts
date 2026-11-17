import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { getRecord, getSettings, upsertRecord } from "@/lib/server/records";
import { issueToken } from "@/lib/server/auth";
import { newId } from "@/lib/server/crypto";
import { link, sendMail } from "@/lib/server/mail";
import { normEmail } from "@/lib/server/accounts";
import { clientUserFor, linksFor, removeClientAccess } from "@/lib/server/clientaccess";

/** Invite a client to their portal: creates (or reuses) their login and emails a set-password link. */
export const POST = handler(async (req) => {
  rateLimit(req, "invite", 30, 3_600_000);
  const owner = await requireUser("owner");
  const { clientId } = (await readJson(req)) as { clientId?: string };
  const client = clientId ? await getRecord(owner.practiceId, "clients", clientId) : null;
  const person = clientId ? await getRecord(owner.practiceId, "people", clientId) : null;
  if (!client || !person) throw new HttpError(404, "Client not found.");
  const email = normEmail(client.email);
  if (!email) throw new HttpError(422, "Add an email address to this client first.");
  const name = `${person.firstName} ${person.lastName}`.trim();

  const [existing] = await db().select().from(schema.users).where(eq(schema.users.email, email));
  let userId: string;
  if (existing) {
    // Deliberately generic: don't reveal whether the address belongs to a practitioner elsewhere.
    if (existing.role !== "client") throw new HttpError(409, "We can’t send a portal invitation to this email address. Ask the client for another address.");
    const links = await linksFor(existing.id);
    const here = links.find((l) => l.practiceId === owner.practiceId);
    if (here && here.clientId !== clientId) throw new HttpError(409, "Another client in your practice already uses this email address.");
    if (here && client.portalAccess === "active") throw new HttpError(409, `${person.firstName} already has portal access. They can sign in with their email address on the sign-in page.`);
    userId = existing.id;
    // One login per person: a client who already has a portal with another astrologer gets this practice added to it.
    if (!here) await db().insert(schema.clientAccess).values({ userId, practiceId: owner.practiceId, clientId: clientId! });
  } else {
    // A previous login for this client under an older email address is replaced.
    const old = await clientUserFor(owner.practiceId, clientId!);
    if (old) await removeClientAccess(owner.practiceId, clientId!);
    userId = newId("usr");
    await db().insert(schema.users).values({ id: userId, practiceId: owner.practiceId, email, name, role: "client", clientId });
    await db().insert(schema.clientAccess).values({ userId, practiceId: owner.practiceId, clientId: clientId! });
  }
  const token = await issueToken(userId, "invite", 24 * 7);
  const s = await getSettings(owner.practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string; practice?: string };
  await sendMail(
    email,
    `${p.name ?? "Your astrologer"} invited you to your client portal`,
    `Hi ${person.firstName},\n\n${p.name ?? "Your astrologer"} (${p.practice ?? "AstrologersDirect"}) has set up a private portal for your readings, recordings, sessions and the work you do between them.\n\nOpen your portal:\n${link(`/auth/invite?token=${token}`)}\n\nNo password needed: whenever you want to come back, enter your email on the sign-in page and we’ll send you a link. This invitation expires in 7 days.`,
  );
  if (client.portalAccess !== "active") await upsertRecord(owner.practiceId, "clients", { ...client, portalAccess: "invited" });
  return json({ ok: true });
});
