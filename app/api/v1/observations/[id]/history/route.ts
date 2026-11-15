import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { getRecord, listSnapshots } from "@/lib/server/records";

/** Server-kept versions of an observation's text, newest first. */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser("owner");
  const { id } = await ctx.params;
  if (!(await getRecord(user.practiceId, "observations", id))) throw new HttpError(404, "Observation not found.");
  return json({ versions: await listSnapshots(user.practiceId, id) });
});
