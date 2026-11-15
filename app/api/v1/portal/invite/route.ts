import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { getRecord, getSettings, upsertRecord } from "@/lib/server/records";
import { issueToken } from "@/lib/server/auth";
import { newId } from "@/lib/server/crypto";
import { link, sendMail } from "@/lib/server/mail";
import { normEmail } from "@/lib/server/accounts";

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
    if (existing.practiceId !== owner.practiceId || existing.clientId !== clientId)
      throw new HttpError(409, "This email address already belongs to another AstrologersDirect account.");
    userId = existing.id;
  } else {
    userId = newId("usr");
    await db().insert(schema.users).values({ id: userId, practiceId: owner.practiceId, email, name, role: "client", clientId });
  }
  const token = await issueToken(userId, "invite", 24 * 7);
  const s = await getSettings(owner.practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string; practice?: string };
  await sendMail(
    email,
    `${p.name ?? "Your astrologer"} invited you to your client portal`,
    `Hi ${person.firstName},\n\n${p.name ?? "Your astrologer"} (${p.practice ?? "AstrologersDirect"}) has set up a private portal where you can find your readings, recordings and consultation history.\n\nChoose a password to open it:\n${link(`/auth/invite?token=${token}`)}\n\nThis link expires in 7 days.`,
  );
  if (client.portalAccess !== "active") await upsertRecord(owner.practiceId, "clients", { ...client, portalAccess: "invited" });
  return json({ ok: true });
});
