import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { linksFor } from "@/lib/server/clientaccess";
import { getSettings } from "@/lib/server/records";
import { send, thread } from "@/lib/server/messages";

/**
 * The signed-in client's conversations, one per astrologer they see.
 *   GET                       every conversation
 *   POST { practiceId, body } send a message to that astrologer
 */
export const GET = handler(async () => {
  const user = await requireUser();
  if (user.role !== "client") throw new HttpError(403, "In a preview, messages are between you and your client: open Messages in the app.");
  const links = await linksFor(user.id);
  const conversations = await Promise.all(
    links.map(async (l) => {
      const s = await getSettings(l.practiceId);
      const p = (s?.practitioner ?? {}) as { name?: string; firstName?: string; practice?: string; photo?: string };
      const messages = await thread(l.practiceId, l.clientId);
      return { practiceId: l.practiceId, astrologer: { name: p.name ?? "Your astrologer", firstName: p.firstName ?? p.name ?? "Your astrologer", practice: p.practice ?? "" }, messages, unread: messages.filter((m) => m.from === "practitioner" && !m.readAt).length };
    }),
  );
  return json({ conversations });
});

export const POST = handler(async (req: Request) => {
  rateLimit(req, "portal-message", 120, 3_600_000);
  const user = await requireUser("client");
  const b = (await readJson(req, 20_000)) as { practiceId?: string; body?: string };
  const link = (await linksFor(user.id)).find((l) => l.practiceId === b.practiceId);
  if (!link) throw new HttpError(404, "Not found.");
  return json({ message: await send(link.practiceId, link.clientId, "client", b.body) });
});
