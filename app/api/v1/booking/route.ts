import { handler, json, readJson, requireUser } from "@/lib/server/http";
import { getBookingProfile, saveBookingProfile } from "@/lib/server/booking";

/** The practice's booking page settings. */
export const GET = handler(async () => {
  const user = await requireUser("owner");
  return json({ profile: await getBookingProfile(user.practiceId) });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser("owner");
  return json({ profile: await saveBookingProfile(user.practiceId, await readJson(req, 200_000)) });
});
