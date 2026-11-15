import { handler, json, requireUser } from "@/lib/server/http";
import { loadSampleData } from "@/lib/server/sample";

/** Adds the demonstration practice's sample records to the signed-in practice. */
export const POST = handler(async () => {
  const user = await requireUser("owner");
  const result = await loadSampleData(user.practiceId);
  return json({ ok: true, ...result });
});
