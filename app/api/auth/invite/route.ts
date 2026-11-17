import { eq } from "drizzle-orm";
import { peekToken } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json } from "@/lib/server/http";
import { getSettings } from "@/lib/server/records";
import { linksFor } from "@/lib/server/clientaccess";

/** Details shown on the invitation page before the client sets a password. */
export const GET = handler(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = await peekToken(token, "invite");
  if (!userId) throw new HttpError(400, "This invitation has expired or was already used. Ask your astrologer to send a new one.");
  const [u] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) throw new HttpError(400, "Invitation not found.");
  // The astrologer who invited them most recently.
  const links = await linksFor(u.id);
  const settings = await getSettings(links[links.length - 1]?.practiceId ?? u.practiceId);
  const p = settings?.practitioner as { name?: string; practice?: string } | undefined;
  return json({ email: u.email, name: u.name, practitioner: p?.name ?? "", practice: p?.practice ?? "", hasPassword: !!u.passwordHash, others: Math.max(0, links.length - 1) });
});
