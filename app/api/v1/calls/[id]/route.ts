import { handler, json, rateLimit, requireUser } from "@/lib/server/http";
import { joinCall } from "@/lib/server/calls";

/** The astrologer joins a session's call (as its owner). */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  rateLimit(req, "call-join", 120, 3_600_000);
  const user = await requireUser("owner");
  return json(await joinCall(user.practiceId, decodeURIComponent((await ctx.params).id), { name: user.name || "Astrologer", owner: true }));
});
