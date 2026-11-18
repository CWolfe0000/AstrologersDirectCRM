import { handler, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { inviteClient } from "@/lib/server/invite";

/** Invite a client to their portal (see lib/server/invite.ts). */
export const POST = handler(async (req) => {
  rateLimit(req, "invite", 30, 3_600_000);
  const owner = await requireUser("owner");
  const { clientId } = (await readJson(req)) as { clientId?: string };
  await inviteClient(owner, clientId);
  return json({ ok: true });
});
