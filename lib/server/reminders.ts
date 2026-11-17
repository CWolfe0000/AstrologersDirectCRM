import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "./db";
import { getSettings, listCollection, upsertRecord } from "./records";
import { link, sendMail } from "./mail";
import { newId } from "./crypto";
import { ianaZone, zonedToUtc } from "@/lib/timezones";
import { scope } from "./clientaccess";

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

/** The local date (YYYY-MM-DD) and hour in a time zone. */
function localNow(now: Date, zone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Between Sessions reminders: shared work with a suggested date and reminders
 * on gets one email the day before (from 9am in the practice's time zone), or
 * on the day if it was shared later. Only for clients with an active portal,
 * and never once they've marked it done. Safe to run as often as you like.
 */
export async function sendDueWorkReminders(now = new Date()) {
  const practiceIds = (await db().selectDistinct({ id: schema.clientWork.practiceId }).from(schema.clientWork)).map((r) => r.id);
  let sent = 0;
  for (const practiceId of practiceIds) {
    const settings = await getSettings(practiceId);
    const p = (settings?.practitioner ?? {}) as { name?: string; firstName?: string; practice?: string; timezone?: string };
    const { date: today, hour } = localNow(now, ianaZone(p.timezone));
    if (hour < 9) continue;
    const work = (await listCollection(practiceId, "clientWork")).filter(
      (w) => w.status === "shared" && w.remind === true && typeof w.dueDate === "string" && (w.dueDate === today || w.dueDate === addDays(today, 1)),
    );
    if (!work.length) continue;
    const [clients, people, responses] = await Promise.all([listCollection(practiceId, "clients"), listCollection(practiceId, "people"), listCollection(practiceId, "workResponses")]);
    for (const w of work as Rec[]) {
      const client = clients.find((c) => c.id === w.clientId) as Rec | undefined;
      const person = people.find((x) => x.id === w.clientId) as Rec | undefined;
      const email = String(client?.email ?? "").trim();
      if (!client || !person || client.portalAccess !== "active" || client.status === "archived" || !email.includes("@")) continue;
      const marks = (responses as Rec[]).filter((r) => r.workId === w.id && (r.type === "done" || r.type === "undone")).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      if (marks.at(-1)?.type === "done") continue;
      const claimed = await db()
        .insert(schema.remindersSent)
        .values({ practiceId, consultationId: `work:${w.id}`, start: String(w.dueDate) })
        .onConflictDoNothing()
        .returning({ id: schema.remindersSent.consultationId });
      if (!claimed.length) continue;
      const who = p.firstName || p.name || "your astrologer";
      const when = w.dueDate === today ? "today" : "tomorrow";
      await sendMail(
        email,
        `A gentle reminder: “${w.title}”`,
        `Hi ${person.firstName},\n\n${who} suggested “${w.title}” for ${when}. There’s no pressure: write as much or as little as you like, whenever you’re ready.\n\nOpen it in your client portal:\n${link(`/portal/work/${scope(practiceId, String(w.id))}`)}\n\n— ${p.practice ?? "AstrologersDirect"}`,
      );
      await upsertRecord(practiceId, "portalNotifications", {
        id: newId("pn"),
        clientId: String(w.clientId),
        title: "A gentle reminder",
        body: `“${w.title}” is suggested for ${when}.`,
        at: new Date().toISOString().slice(0, 19),
        read: false,
        href: `/portal/work/${w.id}`,
      });
      sent++;
    }
  }
  return { sent };
}
