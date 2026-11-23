import "server-only";
import { clientUserFor, scope } from "./clientaccess";
import { getSettings } from "./records";
import { link, sendMail } from "./mail";

/** Email a client when a reading is delivered to their portal (if they have a portal login). */
export async function notifyDelivered(practiceId: string, reading: Record<string, unknown>) {
  const u = await clientUserFor(practiceId, String(reading.clientId));
  if (!u || !u.emailVerifiedAt) return;
  const s = await getSettings(practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string };
  await sendMail(
    u.email,
    `${p.name ?? "Your Astrologer"} Shared a Reading With You`,
    `Hi ${u.name.split(/\s+/)[0]},\n\n${p.name ?? "Your astrologer"} has shared “${reading.title}” with you.\n\nOpen it in your client portal:\n${link(`/portal/readings/${scope(practiceId, String(reading.id))}`)}\n`,
  );
}

const WORK_NOUN: Record<string, string> = { assignment: "an assignment", journal: "a journaling prompt", goal: "a goal", activity: "an activity" };

/** Email a client when between-session work is first shared with them (if they have a portal login). */
export async function notifyWorkShared(practiceId: string, work: Record<string, unknown>) {
  const u = await clientUserFor(practiceId, String(work.clientId));
  if (!u || !u.emailVerifiedAt) return;
  const s = await getSettings(practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string };
  const due = typeof work.dueDate === "string" && work.dueDate ? `\n\nSuggested by: ${new Date(`${work.dueDate}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}` : "";
  await sendMail(
    u.email,
    `${p.name ?? "Your Astrologer"} Shared Something With You: “${work.title}”`,
    `Hi ${u.name.split(/\s+/)[0]},\n\n${p.name ?? "Your astrologer"} has shared “${work.title}” with you.${due}\n\nOpen it in your client portal:\n${link(`/portal/work/${scope(practiceId, String(work.id))}`)}\n`,
  );
}
