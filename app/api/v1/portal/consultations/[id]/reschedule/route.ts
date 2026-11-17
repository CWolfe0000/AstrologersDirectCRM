import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { getRecord, getSettings, upsertRecord } from "@/lib/server/records";
import { resolveScoped } from "@/lib/server/clientaccess";
import { link, sendMail } from "@/lib/server/mail";
import { newId } from "@/lib/server/crypto";
import { nowLocal } from "@/lib/utils";

/**
 * The signed-in client asks to move an upcoming session. The astrologer gets a
 * notification and an email (Reply-To: the client); nothing changes until they act.
 */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  rateLimit(req, "reschedule", 10, 3_600_000);
  const user = await requireUser("client");
  const { practiceId, clientId, id } = await resolveScoped(user, decodeURIComponent((await ctx.params).id));
  const k = await getRecord(practiceId, "consultations", id);
  if (!k || k.clientId !== clientId || k.status !== "scheduled") throw new HttpError(404, "Not found.");
  const { message } = (await readJson(req, 20_000)) as { message?: string };
  const note = String(message ?? "").trim().slice(0, 2000);
  const person = await getRecord(practiceId, "people", clientId);
  const name = `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim() || "Your client";
  await upsertRecord(practiceId, "notifications", {
    id: newId("n"),
    type: "client",
    title: "Reschedule request",
    body: `${name} asked to move “${k.type}” on ${String(k.start).slice(0, 10)}.${note ? ` “${note.slice(0, 140)}${note.length > 140 ? "…" : ""}”` : ""}`,
    at: nowLocal(),
    read: false,
    href: `/app/consultations?id=${id}`,
  });
  const settings = await getSettings(practiceId);
  const p = (settings?.practitioner ?? {}) as { email?: string; firstName?: string };
  const [owner] = await db().select({ email: schema.users.email }).from(schema.users).where(and(eq(schema.users.practiceId, practiceId), eq(schema.users.role, "owner"))).limit(1);
  const to = owner?.email;
  if (to) {
    await sendMail(
      to,
      `${name} asked to reschedule`,
      `Hi ${p.firstName || "there"},\n\n${name} asked to move their ${k.type} on ${String(k.start).replace("T", " at ").slice(0, 19)}.\n\n${note ? `Their message:\n${note}\n\n` : ""}Reply to this email to answer them directly, then update the session in your calendar:\n${link(`/app/consultations?id=${id}`)}\n`,
      { replyTo: user.email },
    );
  }
  return json({ ok: true });
});
