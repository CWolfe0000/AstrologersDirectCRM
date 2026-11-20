import { handler, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { notifyIntake } from "@/lib/server/intake";

/** Tell a client an intake form is waiting (the form record is saved first, like any other record). */
export const POST = handler(async (req) => {
  rateLimit(req, "intake-send", 200, 3_600_000);
  const owner = await requireUser("owner");
  const { requestId } = (await readJson(req)) as { requestId?: string };
  return json(await notifyIntake(owner.practiceId, String(requestId ?? "")));
});
