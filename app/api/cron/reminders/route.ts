import { timingSafeEqual } from "node:crypto";
import { sendDueReminders, sendDueWorkReminders } from "@/lib/server/reminders";

/**
 * Scheduled job (Vercel Cron calls it with "Authorization: Bearer $CRON_SECRET").
 * Sends consultation and Between Sessions reminder emails that are due.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Set CRON_SECRET to enable scheduled jobs.", { status: 503 });
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return new Response("Unauthorized", { status: 401 });
  const consultations = await sendDueReminders();
  const work = await sendDueWorkReminders();
  return Response.json({ sent: consultations.sent + work.sent, consultations: consultations.sent, work: work.sent });
}
