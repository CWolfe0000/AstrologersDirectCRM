import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { changesSince, serverNow } from "@/lib/server/records";

/** Records changed or deleted since `since` (a cursor from bootstrap or a previous call). */
export const GET = handler(async (req) => {
  const user = await requireUser("owner");
  const since = new Date(new URL(req.url).searchParams.get("since") ?? "");
  if (Number.isNaN(since.getTime())) throw new HttpError(400, "Missing or invalid `since`.");
  const now = await serverNow();
  const changes = await changesSince(user.practiceId, since);
  return json({ cursor: now.toISOString(), ...changes });
});
