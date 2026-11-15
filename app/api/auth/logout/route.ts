import { destroySession } from "@/lib/server/auth";
import { handler, json } from "@/lib/server/http";

export const POST = handler(async () => {
  await destroySession();
  return json({ ok: true });
});
