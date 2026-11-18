import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { accessRequestSchema, requestAccess } from "@/lib/server/access";

/** Request a place in the beta (public). The response never reveals whether an account exists. */
export const POST = handler(async (req: Request) => {
  rateLimit(req, "access-request", 5, 3_600_000);
  const parsed = accessRequestSchema.safeParse(await readJson(req, 20_000));
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  await requestAccess(parsed.data);
  return json({ ok: true });
});
