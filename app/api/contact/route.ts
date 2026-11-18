import { z } from "zod";
import { env } from "@/lib/server/env";
import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { sendMail } from "@/lib/server/mail";

const TOPICS = { general: "General inquiry", support: "Product support", early: "The beta & pricing", partnership: "Partnerships & press", data: "Privacy & data" } as const;

const body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("contact"),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    topic: z.enum(Object.keys(TOPICS) as [keyof typeof TOPICS, ...(keyof typeof TOPICS)[]]),
    message: z.string().trim().min(1).max(5000),
    website: z.string().max(200).optional(),
  }),
  z.object({
    kind: z.literal("advisory"),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    website: z.string().max(200).optional(),
  }),
]);

/** Website contact and advisory-group forms: emailed to CONTACT_EMAIL, with Reply-To set to the sender. */
export const POST = handler(async (req: Request) => {
  rateLimit(req, "contact", 5, 3_600_000);
  if (!env.contactEmail) throw new HttpError(503, "The contact form isn’t set up yet. Please try again later.");
  const parsed = body.safeParse(await readJson(req, 20_000));
  if (!parsed.success) throw new HttpError(422, "Please check the form and try again.");
  const f = parsed.data;
  // Honeypot: a hidden field people never fill in. Pretend it worked.
  if (f.website) return json({ ok: true });
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ");
  const [subject, text] =
    f.kind === "contact"
      ? [`Website: ${TOPICS[f.topic]} from ${oneLine(f.name)}`, `${f.message}\n\n—\n${f.name} <${f.email}>\nTopic: ${TOPICS[f.topic]}\nSent from the contact form. Reply to this email to answer them.`]
      : [`Advisory group: ${oneLine(f.name)} wants to join`, `${f.name} <${f.email}> asked to join the practitioner advisory group from the About page.\n\nReply to this email to get in touch.`];
  const status = await sendMail(env.contactEmail, subject, text, { replyTo: f.email });
  if (status.startsWith("failed")) throw new HttpError(502, "We couldn’t send your message just now. Please try again in a few minutes.");
  return json({ ok: true });
});
