import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";
import { nowLocal } from "@/lib/utils";

/** The signed-in client opened one of their delivered readings. */
export const POST = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser("client");
  const { id } = await ctx.params;
  const r = await getRecord(user.practiceId, "readings", id);
  if (!r || r.clientId !== user.clientId || r.status !== "delivered") throw new HttpError(404, "Reading not found.");
  if (r.notification !== "opened") await upsertRecord(user.practiceId, "readings", { ...r, notification: "opened", openedAt: nowLocal() });
  return json({ ok: true });
});
