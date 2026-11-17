import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";
import { resolveScoped } from "@/lib/server/clientaccess";

export const POST = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser("client");
  const { practiceId, clientId, id } = await resolveScoped(user, decodeURIComponent((await ctx.params).id));
  const n = await getRecord(practiceId, "portalNotifications", id);
  if (!n || n.clientId !== clientId) throw new HttpError(404, "Notification not found.");
  if (!n.read) await upsertRecord(practiceId, "portalNotifications", { ...n, read: true });
  return json({ ok: true });
});
