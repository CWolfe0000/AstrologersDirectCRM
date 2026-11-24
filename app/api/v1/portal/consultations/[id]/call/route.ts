import { handler, HttpError, json, rateLimit, requireUser } from "@/lib/server/http";
import { getRecord } from "@/lib/server/records";
import { resolveScoped } from "@/lib/server/clientaccess";
import { joinCall } from "@/lib/server/calls";

/** A signed-in client joins their session's call. */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  rateLimit(req, "call-join", 60, 3_600_000);
  const user = await requireUser("client");
  const { practiceId, clientId, id } = await resolveScoped(user, decodeURIComponent((await ctx.params).id));
  const k = await getRecord(practiceId, "consultations", id);
  if (!k || k.clientId !== clientId) throw new HttpError(404, "Not found.");
  return json(await joinCall(practiceId, id, { name: user.name || "Client", owner: false }));
});
