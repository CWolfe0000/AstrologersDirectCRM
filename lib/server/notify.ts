import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { getSettings } from "./records";
import { link, sendMail } from "./mail";

/** Email a client when a reading is delivered to their portal (if they have a portal login). */
export async function notifyDelivered(practiceId: string, reading: Record<string, unknown>) {
  const [u] = await db()
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.practiceId, practiceId), eq(schema.users.clientId, String(reading.clientId)), eq(schema.users.role, "client")));
  if (!u || !u.passwordHash) return;
  const s = await getSettings(practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string };
  await sendMail(
    u.email,
    `${p.name ?? "Your astrologer"} shared a reading with you`,
    `Hi ${u.name.split(/\s+/)[0]},\n\n${p.name ?? "Your astrologer"} has shared “${reading.title}” with you.\n\nOpen it in your client portal:\n${link(`/portal/readings/${reading.id}`)}\n`,
  );
}
