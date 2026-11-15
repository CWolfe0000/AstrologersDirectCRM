import "server-only";
import { db, schema } from "./db";
import { env } from "./env";
import { newId } from "./crypto";

/**
 * Transactional email. With RESEND_API_KEY set, sends through Resend.
 * Without it (development), the message is stored in the `outbox` table and
 * printed to the server log so links can be followed locally.
 */
export async function sendMail(to: string, subject: string, body: string) {
  let provider = "outbox";
  let status = "logged";
  if (env.resendApiKey) {
    provider = "resend";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.emailFrom, to, subject, text: body }),
      });
      status = res.ok ? "sent" : `failed:${res.status}`;
    } catch (e) {
      status = "failed:" + (e as Error).message.slice(0, 80);
    }
  } else {
    console.info(`\n[mail → ${to}] ${subject}\n${body}\n`);
  }
  await db().insert(schema.outbox).values({ id: newId("mail"), to, subject, body, provider, status });
  return status;
}

export function link(path: string) {
  return env.appUrl.replace(/\/$/, "") + path;
}
