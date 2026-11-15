import { timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/lib/server/reminders";

/**
 * Scheduled job (Vercel Cron calls it with "Authorization: Bearer $CRON_SECRET").
 * Sends consultation reminder emails that are due.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Set CRON_SECRET to enable scheduled jobs.", { status: 503 });
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return new Response("Unauthorized", { status: 401 });
  const result = await sendDueReminders();
  return Response.json(result);
}
