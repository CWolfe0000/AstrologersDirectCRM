import { z } from "zod";
import { createSession, passwordProblem } from "@/lib/server/auth";
import { createPractice, findUserByEmail } from "@/lib/server/accounts";
import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  practice: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  /** Optional: without one, the account signs in with emailed links. */
  password: z.string().optional(),
  timezone: z.string().max(80).optional(),
});

export const POST = handler(async (req) => {
  rateLimit(req, "signup", 10, 3_600_000);
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, "Please fill in your name, practice name and email.");
  const problem = parsed.data.password ? passwordProblem(parsed.data.password) : null;
  if (problem) throw new HttpError(422, problem);
  if (await findUserByEmail(parsed.data.email)) throw new HttpError(409, "An account with this email already exists. Sign in instead.");
  const { userId } = await createPractice(parsed.data);
  await createSession(userId);
  return json({ ok: true }, 201);
});
