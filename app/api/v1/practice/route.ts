import { removePracticeObjects } from "@/lib/server/storage";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { deleteAllRecords } from "@/lib/server/records";
import { releasePracticeClients } from "@/lib/server/clientaccess";

/**
 * Deletes every client record in the practice (clients, charts, observations…)
 * and all client portal logins. The practitioner account remains.
 * Requires { confirm: "DELETE" }.
 */
export const DELETE = handler(async (req) => {
  const user = await requireUser("owner");
  const body = (await readJson(req)) as { confirm?: string };
  if (body.confirm !== "DELETE") throw new HttpError(400, "Type DELETE to confirm.");
  await deleteAllRecords(user.practiceId);
  await removePracticeObjects(user.practiceId);
  // Clients lose this practice from their portal; logins with no other astrologer are removed.
  await releasePracticeClients(user.practiceId);
  return json({ ok: true });
});
