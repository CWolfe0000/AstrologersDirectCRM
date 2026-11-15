import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";

export const POST = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser("client");
  const { id } = await ctx.params;
  const n = await getRecord(user.practiceId, "portalNotifications", id);
  if (!n || n.clientId !== user.clientId) throw new HttpError(404, "Notification not found.");
  if (!n.read) await upsertRecord(user.practiceId, "portalNotifications", { ...n, read: true });
  return json({ ok: true });
});
