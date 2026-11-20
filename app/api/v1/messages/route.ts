import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { clientNames, inbox, send, thread, unreadCount } from "@/lib/server/messages";

/**
 * Practitioner messages.
 *   GET                     the inbox: one row per client conversation
 *   GET ?clientId=…         one conversation
 *   GET ?count=1            unread total (for the menu badge)
 *   POST { clientId, body } send a message to a client
 */
export const GET = handler(async (req: Request) => {
  const user = await requireUser("owner");
  const url = new URL(req.url);
  if (url.searchParams.get("count")) return json({ unread: await unreadCount(user.practiceId, "practitioner") });
  const clientId = url.searchParams.get("clientId");
  if (clientId) return json({ messages: await thread(user.practiceId, clientId) });
  const [threads, names] = await Promise.all([inbox(user.practiceId), clientNames(user.practiceId)]);
  return json({ threads: threads.map((t) => ({ ...t, name: names[t.clientId] || "Client" })) });
});

export const POST = handler(async (req: Request) => {
  rateLimit(req, "message", 300, 3_600_000);
  const user = await requireUser("owner");
  const b = (await readJson(req, 20_000)) as { clientId?: string; body?: string };
  if (!b.clientId) throw new HttpError(422, "Choose a client.");
  return json({ message: await send(user.practiceId, b.clientId, "practitioner", b.body) });
});
