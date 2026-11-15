import { eq } from "drizzle-orm";
import { peekToken } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json } from "@/lib/server/http";
import { getSettings } from "@/lib/server/records";

/** Details shown on the invitation page before the client sets a password. */
export const GET = handler(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = await peekToken(token, "invite");
  if (!userId) throw new HttpError(400, "This invitation has expired or was already used. Ask your astrologer to send a new one.");
  const [u] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) throw new HttpError(400, "Invitation not found.");
  const settings = await getSettings(u.practiceId);
  const p = settings?.practitioner as { name?: string; practice?: string } | undefined;
  return json({ email: u.email, name: u.name, practitioner: p?.name ?? "", practice: p?.practice ?? "" });
});
