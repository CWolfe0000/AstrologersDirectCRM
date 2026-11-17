import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";
import { workResponse } from "@/lib/server/validation";
import { newId } from "@/lib/server/crypto";
import { nowLocal } from "@/lib/utils";

/**
 * The signed-in client responds to work shared with them: a response or
 * journal entry, or marking it done / not done. Responses are append-only.
 */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  rateLimit(req, "work-response", 200, 3_600_000);
  const user = await requireUser("client");
  const { id: workId } = await ctx.params;
  const work = await getRecord(user.practiceId, "clientWork", workId);
  if (!work || work.clientId !== user.clientId || (work.status !== "shared" && work.status !== "completed")) throw new HttpError(404, "Not found.");
  const body = (await readJson(req, 100_000)) as Record<string, unknown>;
  const parsed = workResponse.safeParse({ ...body, workId, clientId: user.clientId });
  if (!parsed.success) throw new HttpError(422, "Please check your response and try again.");
  const r = parsed.data;
  if (r.type === "entry" && !r.text?.trim()) throw new HttpError(422, "Write something first.");
  if (await getRecord(user.practiceId, "workResponses", r.id)) return json({ ok: true }); // already saved (retry)
  await upsertRecord(user.practiceId, "workResponses", { ...r, text: r.type === "entry" ? r.text!.trim() : undefined, createdAt: nowLocal() });
  // Tell the practitioner.
  const person = await getRecord(user.practiceId, "people", user.clientId!);
  const first = String(person?.firstName ?? "Your client");
  const what = r.type === "entry" ? `responded to “${work.title}”` : r.type === "done" ? `marked “${work.title}” as done` : `reopened “${work.title}”`;
  await upsertRecord(user.practiceId, "notifications", {
    id: newId("n"),
    type: "client",
    title: r.type === "entry" ? "New client response" : "Client work updated",
    body: `${first} ${what}.`,
    at: nowLocal(),
    read: false,
    href: `/app/clients/${user.clientId}?tab=work&work=${workId}`,
  });
  return json({ ok: true });
});
