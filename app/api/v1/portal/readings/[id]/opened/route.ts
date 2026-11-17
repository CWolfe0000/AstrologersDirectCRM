import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";
import { resolveScoped } from "@/lib/server/clientaccess";
import { nowLocal } from "@/lib/utils";

/** The signed-in client opened one of their delivered readings (id scoped by practice). */
export const POST = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser("client");
  const { practiceId, clientId, id } = await resolveScoped(user, decodeURIComponent((await ctx.params).id));
  const r = await getRecord(practiceId, "readings", id);
  if (!r || r.clientId !== clientId || r.status !== "delivered") throw new HttpError(404, "Reading not found.");
  if (r.notification !== "opened") await upsertRecord(practiceId, "readings", { ...r, notification: "opened", openedAt: nowLocal() });
  return json({ ok: true });
});
