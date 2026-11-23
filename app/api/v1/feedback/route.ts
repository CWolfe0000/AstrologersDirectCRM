import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { db, schema } from "@/lib/server/db";
import { newId } from "@/lib/server/crypto";
import { sendMail } from "@/lib/server/mail";
import { env } from "@/lib/server/env";
import { FEEDBACK_AREAS } from "@/lib/feedback";

const Body = z.object({ area: z.enum(FEEDBACK_AREAS), text: z.string().trim().min(5, "Tell us a little more.").max(4000) }).strict();

/** "Suggest a Feature": saved for the platform admin, and emailed to the team. */
export const POST = handler(async (req: Request) => {
  rateLimit(req, "feedback", 20, 3_600_000);
  const user = await requireUser("owner");
  const parsed = Body.safeParse(await readJson(req, 20_000));
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Please check your suggestion.");
  const [u] = await db().select({ email: schema.users.email, name: schema.users.name }).from(schema.users).where(eq(schema.users.id, user.id));
  const row = { id: newId("fr"), practiceId: user.practiceId, email: u?.email ?? "", name: u?.name ?? "", area: parsed.data.area, text: parsed.data.text };
  await db().insert(schema.featureRequests).values(row);
  if (env.contactEmail) await sendMail(env.contactEmail, `Feature Suggestion: ${row.area}`, `From ${row.name} <${row.email}>\nArea: ${row.area}\n\n${row.text}\n`).catch(() => {});
  return json({ ok: true });
});
