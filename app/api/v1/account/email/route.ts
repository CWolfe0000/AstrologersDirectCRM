import { handler, json, readJson, requireUser } from "@/lib/server/http";
import { newsEmailsOn, setNewsEmails } from "@/lib/server/email-prefs";

/** News and offers emails from AstrologersDirect: on or off. */
export const GET = handler(async () => {
  const user = await requireUser("owner");
  return json(await newsEmailsOn(user.id));
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser("owner");
  const { on } = (await readJson(req)) as { on?: boolean };
  await setNewsEmails(user.id, on !== false);
  return json(await newsEmailsOn(user.id));
});
