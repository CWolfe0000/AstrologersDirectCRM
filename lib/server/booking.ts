import "server-only";
import { and, eq, inArray, lt, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";
import { HttpError } from "./http";
import { getRecord, getSettings, listCollection, upsertRecord } from "./records";
import { newId, newToken, sha256 } from "./crypto";
import { link, sendMail } from "./mail";
import { inviteClient } from "./invite";
import { birthSchema } from "./validation";
import { ianaZone, zonedToUtc } from "@/lib/timezones";
import { nowLocal } from "@/lib/utils";
import { availableSlots } from "@/lib/booking/slots";
import { DEFAULT_RULES, RESERVED_SLUGS, SLUG_RE, type BookingProfile } from "@/lib/booking/types";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const range = z.object({ start: hhmm, end: hhmm }).strict().refine((r) => r.start < r.end, "Each range must start before it ends.");
const text = (n: number) => z.string().trim().max(n);

export const profileSchema = z
  .object({
    slug: z.string().trim().toLowerCase().regex(SLUG_RE, "Use 3–40 lowercase letters, numbers and hyphens.").refine((s) => !RESERVED_SLUGS.has(s), "That address is reserved. Try another."),
    enabled: z.boolean(),
    displayName: text(120).min(1, "Add the name clients will see."),
    headline: text(160),
    about: text(4000),
    location: text(200),
    meetingUrl: z.union([z.literal(""), z.string().trim().max(500).regex(/^https:\/\/\S+$/, "Use a full https:// link.")]),
    services: z
      .array(
        z
          .object({
            id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
            name: text(120).min(1, "Every service needs a name."),
            description: text(1000),
            durationMin: z.number().int().min(15).max(480),
            price: text(40),
            format: z.enum(["Video call", "Phone", "In person"]),
            active: z.boolean(),
          })
          .strict(),
      )
      .max(30),
    rules: z
      .object({
        weekly: z.object(Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, z.array(range).max(4)])) as Record<string, z.ZodTypeAny>).strict(),
        bufferMin: z.number().int().min(0).max(240),
        minNoticeHours: z.number().int().min(0).max(24 * 30),
        maxAdvanceDays: z.number().int().min(1).max(365),
        stepMin: z.union([z.literal(15), z.literal(30), z.literal(60)]),
        changeNoticeHours: z.number().int().min(0).max(24 * 14),
      })
      .strict(),
    autoInvite: z.boolean(),
  })
  .strict();

async function practitionerOf(practiceId: string) {
  const s = await getSettings(practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string; firstName?: string; title?: string; bio?: string; practice?: string; timezone?: string; email?: string };
  return { ...p, tz: ianaZone(p.timezone) };
}

async function ownerEmail(practiceId: string) {
  const [o] = await db().select({ email: schema.users.email }).from(schema.users).where(and(eq(schema.users.practiceId, practiceId), eq(schema.users.role, "owner"))).limit(1);
  return o?.email ?? null;
}

/** Settings saved before a rule existed get its default. */
const withDefaults = (p: BookingProfile): BookingProfile => ({ ...p, rules: { ...DEFAULT_RULES, ...p.rules } });

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** The practice's booking settings, or a starting point built from their profile. */
export async function getBookingProfile(practiceId: string): Promise<BookingProfile> {
  const [row] = await db().select().from(schema.bookingProfiles).where(eq(schema.bookingProfiles.practiceId, practiceId));
  if (row) return withDefaults({ ...(row.data as BookingProfile), slug: row.slug, enabled: !!row.enabled });
  const p = await practitionerOf(practiceId);
  let slug = slugify(p.name || p.practice || "astrologer");
  if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) slug = `astrologer-${practiceId.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const [taken] = await db().select({ id: schema.bookingProfiles.practiceId }).from(schema.bookingProfiles).where(eq(schema.bookingProfiles.slug, slug));
  if (taken) slug = `${slug.slice(0, 33)}-${practiceId.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  return {
    slug,
    enabled: false,
    displayName: p.name ?? "",
    headline: p.title ?? "",
    about: p.bio ?? "",
    location: "",
    meetingUrl: "",
    services: [
      { id: "natal", name: "Natal Chart Reading", description: "An in-depth look at your birth chart.", durationMin: 90, price: "", format: "Video call", active: true },
      { id: "followup", name: "Follow-Up Session", description: "For returning clients: what’s unfolding now.", durationMin: 60, price: "", format: "Video call", active: true },
    ],
    rules: DEFAULT_RULES,
    autoInvite: true,
  };
}

export async function saveBookingProfile(practiceId: string, input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Please check your booking settings.");
  const p = parsed.data as BookingProfile;
  const [taken] = await db().select({ id: schema.bookingProfiles.practiceId }).from(schema.bookingProfiles).where(and(eq(schema.bookingProfiles.slug, p.slug), ne(schema.bookingProfiles.practiceId, practiceId)));
  if (taken) throw new HttpError(409, "That booking address is taken. Try another.");
  if (p.enabled && !p.services.some((s) => s.active)) throw new HttpError(422, "Add at least one active service before turning booking on.");
  const { slug, enabled, ...data } = p;
  await db()
    .insert(schema.bookingProfiles)
    .values({ practiceId, slug, enabled: enabled ? 1 : 0, data })
    .onConflictDoUpdate({ target: schema.bookingProfiles.practiceId, set: { slug, enabled: enabled ? 1 : 0, data, updatedAt: new Date() } });
  return p;
}

/** A published booking page by its address, or 404. */
export async function publicBooking(slug: string) {
  const [row] = await db().select().from(schema.bookingProfiles).where(eq(schema.bookingProfiles.slug, slug.toLowerCase()));
  if (!row || !row.enabled) throw new HttpError(404, "This booking page isn’t available.");
  const profile = withDefaults({ ...(row.data as BookingProfile), slug: row.slug, enabled: true });
  const p = await practitionerOf(row.practiceId);
  return { practiceId: row.practiceId, profile, tz: p.tz, practitioner: p };
}

/** What a visitor may see: no internal ids beyond services, no practice id. */
export function publicView(b: Awaited<ReturnType<typeof publicBooking>>) {
  const { profile } = b;
  return {
    slug: profile.slug,
    displayName: profile.displayName,
    headline: profile.headline,
    about: profile.about,
    location: profile.location,
    practice: b.practitioner.practice ?? "",
    tz: b.tz,
    maxAdvanceDays: profile.rules.maxAdvanceDays,
    services: profile.services.filter((s) => s.active).map(({ id, name, description, durationMin, price, format }) => ({ id, name, description, durationMin, price, format })),
  };
}

async function busyTimes(practiceId: string, tz: string, excludeId?: string) {
  const ks = await listCollection(practiceId, "consultations");
  return ks
    .filter((k) => k.status === "scheduled" && k.id !== excludeId)
    .map((k) => {
      const start = zonedToUtc(String(k.start), tz).getTime();
      return { start, end: start + Number(k.durationMin) * 60_000 };
    });
}

export async function slotsFor(slug: string, serviceId: string, now = Date.now()) {
  const b = await publicBooking(slug);
  const service = b.profile.services.find((s) => s.id === serviceId && s.active);
  if (!service) throw new HttpError(404, "That service isn’t available.");
  return availableSlots({ rules: b.profile.rules, tz: b.tz, durationMin: service.durationMin, busy: await busyTimes(b.practiceId, b.tz), now });
}

/** UTC instant → "YYYY-MM-DDTHH:mm:00" wall time in a zone (how consultations are stored). */
function wallTime(ms: number, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`;
}
const noticeText = (h: number) => (h % 24 === 0 ? `${h / 24} day${h === 24 ? "" : "s"}` : `${h} hour${h === 1 ? "" : "s"}`);
const when = (ms: number, tz: string) =>
  `${new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(ms))} at ${new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(ms))}`;

export const bookingRequest = z
  .object({
    serviceId: z.string().max(40),
    start: z.string().max(40),
    firstName: text(100).min(1, "Add your first name."),
    lastName: text(100),
    email: z.string().trim().toLowerCase().email("Check your email address.").max(254),
    phone: text(60),
    birth: birthSchema,
    notes: text(2000),
    tz: z.string().max(80),
    website: z.string().max(200).optional(),
  })
  .strict();

const blocksOf = (start: number, end: number) => {
  const out: string[] = [];
  for (let t = Math.floor(start / 900_000) * 900_000; t < end; t += 900_000) out.push(new Date(t).toISOString());
  return out;
};

/**
 * Claim the 15-minute blocks a session covers, so a simultaneous booking for an
 * overlapping time gets a conflict; then re-check against sessions (with the
 * buffer). `release`: a session's previous time, freed first when it moves.
 */
async function claimTime(practiceId: string, tz: string, start: number, end: number, bufferMin: number, excludeId?: string, release?: { start: number; end: number }) {
  const buffer = bufferMin * 60_000;
  const blocks = blocksOf(start, end);
  await db().delete(schema.bookingHolds).where(and(eq(schema.bookingHolds.practiceId, practiceId), lt(schema.bookingHolds.createdAt, new Date(Date.now() - 10 * 60_000))));
  if (release) await db().delete(schema.bookingHolds).where(and(eq(schema.bookingHolds.practiceId, practiceId), inArray(schema.bookingHolds.block, blocksOf(release.start, release.end))));
  const claimed = await db().insert(schema.bookingHolds).values(blocks.map((block) => ({ practiceId, block }))).onConflictDoNothing().returning({ block: schema.bookingHolds.block });
  if (claimed.length < blocks.length) {
    if (claimed.length) await db().delete(schema.bookingHolds).where(and(eq(schema.bookingHolds.practiceId, practiceId), inArray(schema.bookingHolds.block, claimed.map((c) => c.block))));
    throw new HttpError(409, "Someone just booked that time. Please choose another.");
  }
  if ((await busyTimes(practiceId, tz, excludeId)).some((x) => start < x.end + buffer && end > x.start - buffer)) throw new HttpError(409, "That time is no longer available. Please choose another.");
}

/**
 * Book a session: re-checks the time, claims it against simultaneous
 * bookings, then files everything in the practice: client (matched by email),
 * natal chart, consultation, notification, emails, and a portal invitation.
 */
export async function book(slug: string, input: z.infer<typeof bookingRequest>) {
  const b = await publicBooking(slug);
  const { practiceId, profile, tz } = b;
  const service = profile.services.find((s) => s.id === input.serviceId && s.active);
  if (!service) throw new HttpError(404, "That service isn’t available.");
  const start = Date.parse(input.start);
  const end = start + service.durationMin * 60_000;
  const busy = await busyTimes(practiceId, tz);
  const open = availableSlots({ rules: profile.rules, tz, durationMin: service.durationMin, busy, now: Date.now() });
  if (!open.includes(new Date(start).toISOString())) throw new HttpError(409, "That time is no longer available. Please choose another.");

  await claimTime(practiceId, tz, start, end, profile.rules.bufferMin);

  const now = nowLocal();
  const clients = await listCollection(practiceId, "clients");
  const existing = clients.find((c) => String(c.email ?? "").trim().toLowerCase() === input.email && c.status !== "archived");
  let clientId: string;
  let chartId: string | undefined;
  const name = `${input.firstName} ${input.lastName}`.trim();
  if (existing) {
    clientId = String(existing.id);
    const charts = await listCollection(practiceId, "charts", { clientIds: [clientId] });
    chartId = charts.find((c) => c.type === "natal" && (c.personIds as string[])[0] === clientId)?.id as string | undefined;
  } else {
    clientId = newId("c");
    await upsertRecord(practiceId, "people", { id: clientId, firstName: input.firstName, lastName: input.lastName, birth: input.birth });
    await upsertRecord(practiceId, "clients", { id: clientId, email: input.email, ...(input.phone ? { phone: input.phone } : {}), status: "new", source: "Online booking", createdAt: now, tags: [], portalAccess: "none" });
    chartId = newId("ch");
    await upsertRecord(practiceId, "charts", { id: chartId, title: `${name} — Natal`, type: "natal", personIds: [clientId], clientId, createdAt: now, updatedAt: now });
  }
  const meetingUrl = service.format === "Video call" && profile.meetingUrl ? profile.meetingUrl : undefined;
  const consultationId = newId("k");
  const note = [`Booked online (${service.name}).`, input.notes ? `Their note: ${input.notes}` : "", existing ? "" : `New client. Birth details as given: ${input.birth.date}, ${input.birth.timeAccuracy === "unknown" ? "time unknown" : input.birth.time}, ${input.birth.place}.`]
    .filter(Boolean)
    .join("\n\n");
  await upsertRecord(practiceId, "consultations", {
    id: consultationId,
    clientId,
    type: service.name,
    start: wallTime(start, tz),
    durationMin: service.durationMin,
    status: "scheduled",
    location: service.format,
    ...(meetingUrl ? { meetingUrl } : {}),
    chartIds: chartId ? [chartId] : [],
    prepNotes: note,
    readingIds: [],
    recordingIds: [],
  });
  const { raw: token, hash: tokenHash } = newToken();
  await db().insert(schema.bookingTokens).values({ tokenHash, practiceId, consultationId, serviceId: service.id, clientEmail: input.email, clientName: name });
  const manage = link(`/book/manage/${token}`);
  await upsertRecord(practiceId, "notifications", {
    id: newId("n"),
    type: "consultation",
    title: existing ? "New booking" : "New booking from a new client",
    body: `${name} booked ${service.name} for ${when(start, tz)}.`,
    at: now,
    read: false,
    href: `/app/consultations?id=${consultationId}`,
  });

  const astro = profile.displayName || b.practitioner.name || "Your astrologer";
  const owner = await ownerEmail(practiceId);
  const visitorTz = ianaZone(input.tz) || tz;
  const place = service.format === "Video call" ? (meetingUrl ? `Video call: ${meetingUrl}` : `Video call (${astro} will send the link)`) : service.format === "Phone" ? "Phone call" : `In person${profile.location ? `: ${profile.location}` : ""}`;
  await sendMail(
    input.email,
    `Booked: ${service.name} with ${astro}`,
    `Hi ${input.firstName},\n\nYour ${service.name} with ${astro} is booked for ${when(start, visitorTz)}${visitorTz !== tz ? ` (${when(start, tz)} for ${astro})` : ""}.\n\n${service.durationMin} minutes · ${place}${service.price ? `\nPrice: ${service.price} (payment arranged directly with ${astro})` : ""}\n\nNeed to reschedule or cancel? Use your booking link${profile.rules.changeNoticeHours ? ` (up to ${noticeText(profile.rules.changeNoticeHours)} before)` : ""}:\n${manage}\n\nOr reply to this email.\n${profile.autoInvite && !existing ? `\nYou’ll also get an invitation to your private client portal, where ${astro} can share your readings.\n` : ""}`,
    owner ? { replyTo: owner } : {},
  );
  if (owner)
    await sendMail(
      owner,
      `New booking: ${name}, ${service.name}`,
      `${name} booked ${service.name} for ${when(start, tz)}.\n\n${existing ? "They’re an existing client." : "New client: their record and natal chart are ready."}${input.notes ? `\n\nTheir note:\n${input.notes}` : ""}\n\nOpen the session:\n${link(`/app/consultations?id=${consultationId}`)}\n\nReply to this email to reach them.`,
      { replyTo: input.email },
    );
  if (profile.autoInvite && (!existing || existing.portalAccess === "none")) {
    // Best effort: an address that can't be invited (e.g. a practitioner's) just isn't.
    await inviteClient({ practiceId }, clientId).catch(() => {});
  }
  return { start: new Date(start).toISOString(), service: service.name, durationMin: service.durationMin, format: service.format, displayName: astro, meetingUrl: meetingUrl ?? null, manage: `/book/manage/${token}` };
}

// ——— Managing a booking (the client's private link) ————————————————————

async function lookup(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) throw new HttpError(404, "This booking link isn’t valid.");
  const [row] = await db().select().from(schema.bookingTokens).where(eq(schema.bookingTokens.tokenHash, sha256(token)));
  if (!row) throw new HttpError(404, "This booking link isn’t valid.");
  const k = await getRecord(row.practiceId, "consultations", row.consultationId);
  if (!k) throw new HttpError(404, "This session no longer exists. Please contact your astrologer.");
  const profile = await getBookingProfile(row.practiceId);
  const p = await practitionerOf(row.practiceId);
  const tz = p.tz;
  const start = zonedToUtc(String(k.start), tz).getTime();
  const deadline = start - profile.rules.changeNoticeHours * 3_600_000;
  const service = profile.services.find((x) => x.id === row.serviceId);
  const canChange = k.status === "scheduled" && Date.now() <= deadline;
  return { row, k, profile, practitioner: p, tz, start, deadline, service, canChange, canReschedule: canChange && profile.enabled && !!service };
}

/** What the client sees on their booking page. */
export async function manageView(token: string) {
  const b = await lookup(token);
  return {
    service: String(b.k.type),
    durationMin: Number(b.k.durationMin),
    format: String(b.k.location),
    start: new Date(b.start).toISOString(),
    status: b.k.status === "cancelled" ? "canceled" : b.start + Number(b.k.durationMin) * 60_000 < Date.now() ? "past" : b.k.status === "scheduled" ? "scheduled" : "closed",
    displayName: b.profile.displayName || b.practitioner.name || "Your astrologer",
    clientName: b.row.clientName,
    meetingUrl: typeof b.k.meetingUrl === "string" ? b.k.meetingUrl : null,
    canChange: b.canChange,
    canReschedule: b.canReschedule,
    deadline: new Date(b.deadline).toISOString(),
    noticeHours: b.profile.rules.changeNoticeHours,
  };
}

export async function manageSlots(token: string) {
  const b = await lookup(token);
  if (!b.canReschedule || !b.service) throw new HttpError(409, "This session can’t be rescheduled online. Please contact your astrologer.");
  const busy = await busyTimes(b.row.practiceId, b.tz, b.row.consultationId);
  return availableSlots({ rules: b.profile.rules, tz: b.tz, durationMin: Number(b.k.durationMin), busy, now: Date.now() }).filter((x) => Date.parse(x) !== b.start);
}

async function tellBoth(b: Awaited<ReturnType<typeof lookup>>, client: { subject: string; body: string }, astro: { title: string; body: string; email: string }) {
  await upsertRecord(b.row.practiceId, "notifications", { id: newId("n"), type: "consultation", title: astro.title, body: astro.body, at: nowLocal(), read: false, href: `/app/consultations?id=${b.row.consultationId}` });
  const owner = await ownerEmail(b.row.practiceId);
  await sendMail(b.row.clientEmail, client.subject, client.body, owner ? { replyTo: owner } : {});
  if (owner) await sendMail(owner, astro.title + `: ${b.row.clientName}`, astro.email, { replyTo: b.row.clientEmail });
}

export async function reschedule(token: string, startIso: string, visitorTz: string) {
  const b = await lookup(token);
  if (!b.canReschedule || !b.service) throw new HttpError(409, "This session can’t be rescheduled online. Please contact your astrologer.");
  const start = Date.parse(startIso);
  const duration = Number(b.k.durationMin);
  const busy = await busyTimes(b.row.practiceId, b.tz, b.row.consultationId);
  if (!availableSlots({ rules: b.profile.rules, tz: b.tz, durationMin: duration, busy, now: Date.now() }).includes(new Date(start).toISOString()))
    throw new HttpError(409, "That time is no longer available. Please choose another.");
  await claimTime(b.row.practiceId, b.tz, start, start + duration * 60_000, b.profile.rules.bufferMin, b.row.consultationId, { start: b.start, end: b.start + duration * 60_000 });
  const fresh = (await getRecord(b.row.practiceId, "consultations", b.row.consultationId))!;
  const note = `Rescheduled online by the client from ${when(b.start, b.tz)} to ${when(start, b.tz)}.`;
  await upsertRecord(b.row.practiceId, "consultations", { ...fresh, start: wallTime(start, b.tz), prepNotes: [fresh.prepNotes, note].filter(Boolean).join("\n\n") });
  const astro = b.profile.displayName || b.practitioner.name || "your astrologer";
  const vz = ianaZone(visitorTz) || b.tz;
  await tellBoth(
    b,
    { subject: `Rescheduled: ${b.k.type} with ${astro}`, body: `Hi ${b.row.clientName.split(" ")[0]},\n\nYour ${b.k.type} with ${astro} is now ${when(start, vz)}.\n\nYour booking link still works if you need to change it again:\n${link(`/book/manage/${token}`)}\n` },
    { title: "Session Rescheduled", body: `${b.row.clientName} moved ${b.k.type} from ${when(b.start, b.tz)} to ${when(start, b.tz)}.`, email: `${b.row.clientName} moved ${b.k.type}:\n\nFrom: ${when(b.start, b.tz)}\nTo: ${when(start, b.tz)}\n\nOpen the session:\n${link(`/app/consultations?id=${b.row.consultationId}`)}\n` },
  );
  return manageView(token);
}

export async function cancelBooking(token: string, reason: string) {
  const b = await lookup(token);
  if (!b.canChange) throw new HttpError(409, "This session can’t be canceled online. Please contact your astrologer.");
  const fresh = (await getRecord(b.row.practiceId, "consultations", b.row.consultationId))!;
  const why = reason.trim().slice(0, 1000);
  await upsertRecord(b.row.practiceId, "consultations", { ...fresh, status: "cancelled", prepNotes: [fresh.prepNotes, `Canceled online by the client.${why ? ` Their reason: ${why}` : ""}`].filter(Boolean).join("\n\n") });
  const astro = b.profile.displayName || b.practitioner.name || "your astrologer";
  await tellBoth(
    b,
    { subject: `Canceled: ${b.k.type} with ${astro}`, body: `Hi ${b.row.clientName.split(" ")[0]},\n\nYour ${b.k.type} with ${astro} on ${when(b.start, b.tz)} is canceled.${b.profile.enabled && b.profile.slug ? `\n\nWhenever you’d like to book again:\n${link(`/book/${b.profile.slug}`)}` : ""}\n` },
    { title: "Session Canceled", body: `${b.row.clientName} canceled ${b.k.type} on ${when(b.start, b.tz)}.${why ? ` “${why.slice(0, 140)}”` : ""}`, email: `${b.row.clientName} canceled ${b.k.type} on ${when(b.start, b.tz)}.${why ? `\n\nTheir reason:\n${why}` : ""}\n\nThe time is free again on your booking page.\n` },
  );
  return manageView(token);
}
