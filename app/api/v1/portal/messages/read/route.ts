import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { linksFor } from "@/lib/server/clientaccess";
import { markRead } from "@/lib/server/messages";

/** The client has read their astrologer's messages. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser("client");
  const { practiceId } = (await readJson(req)) as { practiceId?: string };
  const link = (await linksFor(user.id)).find((l) => l.practiceId === practiceId);
  if (!link) throw new HttpError(404, "Not found.");
  await markRead(link.practiceId, link.clientId, "client");
  return json({ ok: true });
});
