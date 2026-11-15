import { getUser } from "@/lib/server/auth";
import { handler, json } from "@/lib/server/http";

export const GET = handler(async () => {
  const user = await getUser();
  return json({ user });
});
