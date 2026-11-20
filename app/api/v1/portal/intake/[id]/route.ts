import { handler, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { resolveScoped } from "@/lib/server/clientaccess";
import { submitIntake } from "@/lib/server/intake";

/** The signed-in client sends their answers to an intake form. */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  rateLimit(req, "intake-submit", 30, 3_600_000);
  const user = await requireUser("client");
  const { practiceId, clientId, id } = await resolveScoped(user, decodeURIComponent((await ctx.params).id));
  const { answers } = (await readJson(req, 200_000)) as { answers?: unknown };
  return json(await submitIntake(practiceId, clientId, id, answers ?? {}));
});
