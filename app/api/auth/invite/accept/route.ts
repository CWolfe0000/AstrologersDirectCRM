import { eq } from "drizzle-orm";
import { consumeToken, hashPassword, passwordProblem } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";
import { linksFor } from "@/lib/server/clientaccess";
import { finish } from "@/lib/server/emailauth";

/**
 * Accept a portal invitation. The emailed link proves the address, so it signs
 * the client in (two-factor still applies if they turned it on). A password is
 * optional and is only set when the login doesn't have one yet: an invitation
 * never replaces an existing password.
 */
export const POST = handler(async (req) => {
  const { token, password } = (await readJson(req)) as { token?: string; password?: string };
  const problem = password ? passwordProblem(String(password)) : null;
  if (problem) throw new HttpError(422, problem);
  const userId = await consumeToken(String(token ?? ""), "invite");
  if (!userId) throw new HttpError(400, "This invitation has expired or was already used. Ask your astrologer to send a new one, or sign in with your email.");
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user || user.role !== "client") throw new HttpError(400, "Invitation not found.");
  if (password && !user.passwordHash) await db().update(schema.users).set({ passwordHash: await hashPassword(String(password)) }).where(eq(schema.users.id, userId));
  // Every astrologer who invited them now shows the portal as active.
  for (const l of await linksFor(userId)) {
    const c = await getRecord(l.practiceId, "clients", l.clientId);
    if (c && c.portalAccess === "invited") await upsertRecord(l.practiceId, "clients", { ...c, portalAccess: "active" });
  }
  const [fresh] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  return json(await finish(fresh!));
});
