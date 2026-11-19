import "server-only";
import { db, schema } from "./db";
import { env } from "./env";
import { newId } from "./crypto";

/**
 * Transactional email. With RESEND_API_KEY set, sends through Resend. Without
 * it (development), the message is stored in `outbox` and printed to the log.
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
  // With a real provider, never keep live links.
  const stored = provider === "outbox" ? body : body.replace(/token=[\w-]+/g, "token=[redacted]");
  await db().insert(schema.outbox).values({ id: newId("mail"), to, subject, body: stored, provider, status });
  return status;
}
