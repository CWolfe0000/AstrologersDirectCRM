import { handler, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin";
import { inviteOnly, listRequests } from "@/lib/server/access";

export const GET = handler(async () => {
  await requireAdmin();
  return json({ requests: await listRequests(), inviteOnly: await inviteOnly(), forced: process.env.BETA_INVITE_ONLY === "true" });
});
