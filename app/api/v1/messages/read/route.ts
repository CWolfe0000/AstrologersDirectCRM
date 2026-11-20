import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { markRead } from "@/lib/server/messages";

/** The practitioner has read a client's messages. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser("owner");
  const { clientId } = (await readJson(req)) as { clientId?: string };
  if (!clientId) throw new HttpError(422, "Choose a client.");
  await markRead(user.practiceId, clientId, "practitioner");
  return json({ ok: true });
});
