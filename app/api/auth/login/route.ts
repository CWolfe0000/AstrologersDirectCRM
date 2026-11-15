import { createSession, verifyPassword } from "@/lib/server/auth";
import { findUserByEmail } from "@/lib/server/accounts";
import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";

export const POST = handler(async (req) => {
  rateLimit(req, "login", 20, 15 * 60_000);
  const body = (await readJson(req)) as { email?: string; password?: string };
  const user = body.email ? await findUserByEmail(body.email) : null;
  const ok = await verifyPassword(String(body.password ?? ""), user?.passwordHash ?? null);
  if (!user || !ok) throw new HttpError(401, "That email and password don't match. Check them and try again.");
  await createSession(user.id);
  return json({ ok: true, role: user.role, redirect: user.role === "client" ? "/portal" : "/app" });
});
