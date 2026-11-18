import { handler, HttpError, json, readJson } from "@/lib/server/http";
import { logAdmin, requireAdmin } from "@/lib/server/admin";
import { decide } from "@/lib/server/access";

/** Approve (sends the sign-up link) or decline a beta request. */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { action } = (await readJson(req)) as { action?: string };
  if (action !== "approve" && action !== "decline") throw new HttpError(422, "Approve or decline.");
  const id = (await ctx.params).id;
  await decide(id, action, admin.email);
  await logAdmin(admin.email, `access-${action}`, id);
  return json({ ok: true });
});
