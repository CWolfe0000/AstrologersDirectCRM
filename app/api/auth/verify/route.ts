import { eq } from "drizzle-orm";
import { consumeToken } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson } from "@/lib/server/http";

export const POST = handler(async (req) => {
  const { token } = (await readJson(req)) as { token?: string };
  const userId = await consumeToken(String(token ?? ""), "verify");
  if (!userId) throw new HttpError(400, "This confirmation link has expired or was already used. Request a new one from your account.");
  await db().update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
  return json({ ok: true });
});
