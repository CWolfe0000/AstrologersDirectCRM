import { z } from "zod";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { putSettings } from "@/lib/server/records";
import { practitionerSchema, settingsSchema } from "@/lib/server/validation";

const Body = z.object({ practitioner: practitionerSchema, defaults: settingsSchema }).strict();

export const PUT = handler(async (req) => {
  const user = await requireUser("owner");
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, "Some settings are invalid.", parsed.error.flatten());
  await putSettings(user.practiceId, parsed.data.practitioner, parsed.data.defaults);
  return json({ ok: true });
});
