import { handler, json, readJson } from "@/lib/server/http";
import { logAdmin, requireAdmin } from "@/lib/server/admin";
import { setInviteOnly } from "@/lib/server/access";

/** Platform switches: { inviteOnly: boolean } (BETA_INVITE_ONLY=true overrides it on). */
export const PUT = handler(async (req: Request) => {
  const admin = await requireAdmin();
  const { inviteOnly } = (await readJson(req)) as { inviteOnly?: boolean };
  await setInviteOnly(!!inviteOnly);
  await logAdmin(admin.email, "invite-only", "platform", inviteOnly ? "on" : "off");
  return json({ ok: true });
});
