import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "./db";
import { getSettings, listCollection, upsertRecord } from "./records";
import { link, sendMail } from "./mail";
import { newId } from "./crypto";
import { ianaZone, zonedToUtc } from "@/lib/timezones";

type Rec = Record<string, unknown>;

function when(local: string, zone: string) {
  const d = zonedToUtc(local, zone);
  const date = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "long", month: "long", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d);
  return `${date} at ${time}`;
}

/**
 * Send consultation reminders for every practice that has them on. Anything
 * scheduled within each practice's reminder window that hasn't had a
 * reminder for this start time gets one. Safe to run as often as you like.
 */
export async function sendDueReminders(now = new Date()) {
  const practices = await db()
    .select({ practiceId: schema.practiceSettings.practiceId })
    .from(schema.practiceSettings)
    .where(sql`(${schema.practiceSettings.practitioner} -> 'reminders' ->> 'clients') = 'true'`);
  let sent = 0;
  for (const { practiceId } of practices) {
    const settings = await getSettings(practiceId);
    const p = (settings?.practitioner ?? {}) as { name?: string; practice?: string; timezone?: string; reminders?: { hoursBefore?: number } };
    const zone = ianaZone(p.timezone);
    const windowMs = Math.min(Math.max(p.reminders?.hoursBefore ?? 24, 1), 168) * 3_600_000;
    const [consultations, clients, people] = await Promise.all([
      listCollection(practiceId, "consultations"),
      listCollection(practiceId, "clients"),
      listCollection(practiceId, "people"),
    ]);
    for (const k of consultations as Rec[]) {
      if (k.status !== "scheduled") continue;
      const start = zonedToUtc(String(k.start), zone).getTime();
      if (start <= now.getTime() || start - now.getTime() > windowMs) continue;
      const client = clients.find((c) => c.id === k.clientId) as Rec | undefined;
      const person = people.find((x) => x.id === k.clientId) as Rec | undefined;
      const email = String(client?.email ?? "").trim();
      if (!client || !person || !email.includes("@") || client.status === "archived") continue;
      // Claim the reminder first, so two overlapping runs can't both send it.
      const claimed = await db()
        .insert(schema.remindersSent)
        .values({ practiceId, consultationId: String(k.id), start: String(k.start) })
        .onConflictDoNothing()
        .returning({ id: schema.remindersSent.consultationId });
      if (!claimed.length) continue;
      const portal = client.portalAccess === "active" ? `\n\nYour readings and session details are in your client portal:\n${link("/portal")}` : "";
      await sendMail(
        email,
        `Reminder: your ${k.type} with ${p.name ?? "your astrologer"}`,
        `Hi ${person.firstName},\n\nThis is a reminder of your ${k.type} on ${when(String(k.start), zone)} (${k.durationMin} minutes, ${String(k.location).toLowerCase()}).${portal}\n\nIf you need to reschedule, reply to ${p.name ?? "your astrologer"} directly.\n\n— ${p.practice ?? "AstrologersDirect"}`,
      );
      if (client.portalAccess === "active") {
        await upsertRecord(practiceId, "portalNotifications", {
          id: newId("pn"),
          clientId: String(k.clientId),
          title: "Upcoming consultation",
          body: `${k.type} on ${when(String(k.start), zone)}.`,
          at: new Date().toISOString().slice(0, 19),
          read: false,
          href: "/portal/consultations",
        });
      }
      sent++;
    }
  }
  return { sent };
}
