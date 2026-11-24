import "server-only";
import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";
import { HttpError } from "./http";
import { getRecord, getSettings, listCollection, upsertRecord } from "./records";
import { newId, newToken, seal, sha256, unseal } from "./crypto";
import { link, sendMail } from "./mail";
import { intakeFormsOf, requestFromForm, submitIntake } from "./intake";
import { inviteClient } from "./invite";
import { birthSchema } from "./validation";
import { ianaZone, zonedToUtc } from "@/lib/timezones";
import { nowLocal } from "@/lib/utils";
import { availableSlots } from "@/lib/booking/slots";
import { DEFAULT_RULES, RESERVED_SLUGS, SLUG_RE, type BookingProfile, type BookingService } from "@/lib/booking/types";
import type { IntakeRequest } from "@/lib/data/types";
import { DEFAULT_INSTRUCTIONS, currentFormat, instructionsKey, isCall, isDelivered } from "@/lib/booking/formats";
import { DEFAULT_REFUND_POLICY, money, priceCents, refundFor, refundPolicyText } from "@/lib/booking/payments";
import { paymentAccount, paymentForConsultation, refundPayment } from "./payments";
import { platformFeePercent, stripe, stripeEnabled } from "./stripe";
import { callsEnabled, joinCall, usesBuiltInCall } from "./calls";

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
            format: z.enum(["Live session", "Recorded reading", "Written reading", "Video call", "Audio call", "Phone", "In person"]),
            deliveryDays: z.number().int().min(1).max(90).optional(),
            recording: z.enum(["audio", "video"]).optional(),
            call: z.enum(["audio", "video"]).optional(),
            active: z.boolean(),
            /** The intake form sent when someone books this service. */
            intakeFormId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/).optional(),
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
    callVia: z.enum(["astrologersdirect", "own-link"]).optional(),
    /** Take payment when clients book (once the astrologer's Stripe account is ready). */
    takePayments: z.boolean().optional(),
    refundPolicy: z.object({ fullRefundHours: z.number().int().min(0).max(24 * 14), lateRefundPercent: z.number().int().min(0).max(100) }).strict().optional(),
    searchable: z.boolean().optional(),
    instructions: z.object({ "Live session": text(2000).optional(), "Recorded reading": text(2000).optional(), "Written reading": text(2000).optional(), Phone: text(2000).optional(), "Video call": text(2000).optional(), "Audio call": text(2000).optional() }).strict().optional(),
    // A square photo resized in the browser (about 400px): a data URL, kept small.
    photo: z.string().max(250_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Use a JPEG, PNG or WebP photo.").optional(),
    links: z
      .array(z.object({ label: text(60).min(1, "Give each link a label."), url: z.string().trim().max(500).regex(/^https:\/\/\S+$/, "Links must start with https://.") }).strict())
      .max(8)
      .optional(),
  })
  .strict();

async function practitionerOf(practiceId: string) {
  const s = await getSettings(practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string; firstName?: string; title?: string; bio?: string; practice?: string; timezone?: string; email?: string; portalAccent?: string; photo?: string; website?: string; links?: { label: string; url: string }[] };
  return { ...p, tz: ianaZone(p.timezone), accent: p.portalAccent };
}

async function ownerEmail(practiceId: string) {
  const [o] = await db().select({ email: schema.users.email }).from(schema.users).where(and(eq(schema.users.practiceId, practiceId), eq(schema.users.role, "owner"))).limit(1);
  return o?.email ?? null;
}

/** Settings saved before a rule existed get its default. */
// Services saved as "Video call" / "Audio call" are live sessions under today's name.
const withDefaults = (p: BookingProfile): BookingProfile => ({ ...p, refundPolicy: p.refundPolicy ?? DEFAULT_REFUND_POLICY, takePayments: p.takePayments ?? true, services: p.services.map((x) => ({ ...x, format: currentFormat(x.format) as BookingService["format"] })), rules: { ...DEFAULT_RULES, ...p.rules } });

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
  return withDefaults(p);
}

/** A published booking page by its address, or 404. */
export async function publicBooking(slug: string) {
  const [row] = await db().select().from(schema.bookingProfiles).where(eq(schema.bookingProfiles.slug, slug.toLowerCase()));
  if (!row || !row.enabled) throw new HttpError(404, "This booking page isn’t available.");
  return bookingContext(row);
}

/** Whether this page takes payment for priced services right now. */
export async function takesPayments(b: Awaited<ReturnType<typeof publicBooking>>) {
  if (!stripeEnabled() || b.profile.takePayments === false) return false;
  return !!(await paymentAccount(b.practiceId))?.chargesEnabled;
}

async function bookingContext(row: typeof schema.bookingProfiles.$inferSelect) {
  const p = await practitionerOf(row.practiceId);
  // Who the astrologer is comes from their profile (Settings › Your Profile); what was saved on the booking page
  // before that existed is the fallback.
  const saved = row.data as BookingProfile;
  const website = p.website?.trim() ? [{ label: "Website", url: /^https?:\/\//.test(p.website.trim()) ? p.website.trim() : `https://${p.website.trim()}` }] : [];
  const links = [...website, ...(p.links ?? saved.links ?? [])].filter((l, i, a) => a.findIndex((x) => x.url === l.url) === i);
  const profile = withDefaults({ ...saved, slug: row.slug, enabled: true, displayName: p.name || saved.displayName, headline: p.title ?? saved.headline, about: p.bio || saved.about, photo: p.photo ?? saved.photo, links });
  return { practiceId: row.practiceId, profile, tz: p.tz, practitioner: p };
}

/** What a visitor may see: no internal ids beyond services, no practice id. */
export function publicView(b: Awaited<ReturnType<typeof publicBooking>>, paid = false) {
  const { profile } = b;
  return {
    /** Clients pay when they book (priced services), with this refund policy. */
    payments: paid ? { refundPolicy: refundPolicyText(profile.refundPolicy ?? DEFAULT_REFUND_POLICY) } : null,
    slug: profile.slug,
    displayName: profile.displayName,
    headline: profile.headline,
    about: profile.about,
    location: profile.location,
    photo: profile.photo ?? null,
    links: profile.links ?? [],
    accent: b.practitioner.accent ?? null,
    practice: b.practitioner.practice ?? "",
    tz: b.tz,
    maxAdvanceDays: profile.rules.maxAdvanceDays,
    services: profile.services.filter((s) => s.active).map(({ id, name, description, durationMin, price, format, deliveryDays, recording, call }) => ({ id, name, description, durationMin, price, format, ...(isDelivered(format) ? { deliveryDays: deliveryDays ?? 7 } : {}), ...(format === "Recorded reading" ? { recording: recording ?? "audio" } : {}), ...(isCall(format) && builtInCalls(profile) ? { call: call ?? "video" } : {}) })),
  };
}

/** Whether this astrologer's live sessions happen on AstrologersDirect's own calls. */
export const builtInCalls = (p: Pick<BookingProfile, "callVia" | "meetingUrl">) => callsEnabled() && (p.callVia ?? (p.meetingUrl ? "own-link" : "astrologersdirect")) === "astrologersdirect";

/** What the client needs to know for this format: the astrologer's words, or a sensible default. */
function instructionsFor(profile: BookingProfile, format: string) {
  const key = instructionsKey(format);
  if (!key) return "";
  // Instructions saved under the earlier call names still apply to live sessions.
  const own = profile.instructions?.[key] ?? (key === "Live session" ? profile.instructions?.["Video call"] ?? profile.instructions?.["Audio call"] : undefined);
  return (own === undefined ? DEFAULT_INSTRUCTIONS[key] : own).trim();
}

async function busyTimes(practiceId: string, tz: string, excludeId?: string) {
  const ks = await listCollection(practiceId, "consultations");
  // Times held while a client is paying.
  const held = await db().select({ start: schema.bookingPayments.startAt, end: schema.bookingPayments.endAt }).from(schema.bookingPayments)
    .where(and(eq(schema.bookingPayments.practiceId, practiceId), eq(schema.bookingPayments.status, "pending"), gt(schema.bookingPayments.expiresAt, new Date())));
  const heldTimes = held.filter((h) => h.start && h.end).map((h) => ({ start: h.start!.getTime(), end: h.end!.getTime() }));
  return [...heldTimes, ...ks
    // Written readings have a delivery date, not a time on the calendar.
    .filter((k) => k.status === "scheduled" && k.id !== excludeId && !isDelivered(String(k.location)))
    .map((k) => {
      const start = zonedToUtc(String(k.start), tz).getTime();
      return { start, end: start + Number(k.durationMin) * 60_000 };
    })];
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
  const written = isDelivered(service.format);
  if (service.format === "Phone" && !input.phone.trim()) throw new HttpError(422, "Add a phone number so your astrologer can call you.");
  let start: number;
  if (written) {
    // No time slot: due at midday in the astrologer's time zone, the delivery time from today.
    const dueDay = wallTime(Date.now() + (service.deliveryDays ?? 7) * 86_400_000, tz).slice(0, 10);
    start = zonedToUtc(`${dueDay}T12:00:00`, tz).getTime();
  } else {
    start = Date.parse(input.start);
    const end = start + service.durationMin * 60_000;
    const busy = await busyTimes(practiceId, tz);
    const open = availableSlots({ rules: profile.rules, tz, durationMin: service.durationMin, busy, now: Date.now() });
    if (!open.includes(new Date(start).toISOString())) throw new HttpError(409, "That time is no longer available. Please choose another.");
    await claimTime(practiceId, tz, start, end, profile.rules.bufferMin);
  }
  const pay = await startCheckout(b, service, input, start, written);
  if (pay) return pay;
  const { consultationId: _id, ...booked } = await createBooking(b, service, input, start, null);
  void _id;
  return booked;
}

type BookingInput = z.infer<typeof bookingRequest>;
type Context = Awaited<ReturnType<typeof publicBooking>>;
type Paid = { amount: number; currency: string };

/**
 * Priced service and the astrologer takes payments: hold the time, keep the
 * request (sealed) and send the client to Stripe Checkout. The booking is
 * made when Stripe confirms payment (confirmCheckout / the webhook).
 */
async function startCheckout(b: Context, service: BookingService, input: BookingInput, start: number, written: boolean) {
  const cents = priceCents(service.price);
  if (!cents || !(await takesPayments(b))) return null;
  const acct = (await paymentAccount(b.practiceId))!;
  const id = newId("pay");
  const expires = Date.now() + 31 * 60_000; // Stripe's shortest checkout lifetime is 30 minutes
  const name = `${input.firstName} ${input.lastName}`.trim();
  await db().insert(schema.bookingPayments).values({
    id, practiceId: b.practiceId, stripeAccountId: acct.stripeAccountId, status: "pending", amount: cents, currency: acct.currency, serviceName: service.name, clientName: name,
    startAt: written ? null : new Date(start), endAt: written ? null : new Date(start + service.durationMin * 60_000), expiresAt: new Date(expires),
    sealed: seal({ service, input, start }),
  });
  const astro = b.profile.displayName || b.practitioner.name || "your astrologer";
  const back = (q: string) => link(`/book/${b.profile.slug}?${q}`);
  const fee = Math.round((cents * platformFeePercent()) / 100);
  try {
    const session = await stripe<{ id: string; url: string }>(
      "POST",
      "/checkout/sessions",
      {
        mode: "payment",
        customer_email: input.email,
        line_items: [{ quantity: 1, price_data: { currency: acct.currency, unit_amount: cents, product_data: { name: `${service.name} with ${astro}`, description: written ? `Ready in ${service.deliveryDays ?? 7} days` : `${when(start, ianaZone(input.tz) || b.tz)} · ${service.durationMin} minutes` } } }],
        payment_intent_data: { description: `${service.name}: ${name}`, metadata: { booking_payment: id }, ...(fee ? { application_fee_amount: fee } : {}) },
        metadata: { booking_payment: id },
        expires_at: Math.floor(expires / 1000) - 30,
        success_url: back("paid={CHECKOUT_SESSION_ID}"),
        cancel_url: back(`unpaid=${id}`),
      },
      { account: acct.stripeAccountId, idempotencyKey: `checkout-${id}` },
    );
    await db().update(schema.bookingPayments).set({ checkoutSessionId: session.id }).where(eq(schema.bookingPayments.id, id));
    return { checkout: session.url };
  } catch (e) {
    await db().delete(schema.bookingPayments).where(eq(schema.bookingPayments.id, id));
    console.error("checkout failed", e);
    throw new HttpError(502, "Payment couldn’t be started. Please try again in a moment.");
  }
}

/** Make the booking for a checkout Stripe says is paid (once, however many times it's called). */
async function finishPaid(row: typeof schema.bookingPayments.$inferSelect, paymentIntent: string | null) {
  const [claimed] = await db().update(schema.bookingPayments).set({ status: "paid", paidAt: new Date(), paymentIntentId: paymentIntent })
    .where(and(eq(schema.bookingPayments.id, row.id), inArray(schema.bookingPayments.status, ["pending", "expired"]))).returning();
  if (!claimed) return;
  const req = unseal<{ service: BookingService; input: BookingInput; start: number }>(row.sealed);
  const [prof] = await db().select().from(schema.bookingProfiles).where(eq(schema.bookingProfiles.practiceId, row.practiceId));
  const b = await bookingContext(prof);
  const booked = await createBooking(b, req.service, req.input, req.start, { amount: row.amount, currency: row.currency });
  await db().update(schema.bookingPayments).set({ sealed: seal({ booked }), consultationId: booked.consultationId }).where(eq(schema.bookingPayments.id, row.id));
}

type CheckoutSession = { id: string; payment_status: string; payment_intent: string | null; status: string };

/** Stripe's webhook: a checkout finished. */
export async function checkoutCompleted(session: CheckoutSession) {
  const [row] = await db().select().from(schema.bookingPayments).where(eq(schema.bookingPayments.checkoutSessionId, session.id));
  if (!row) return;
  if (session.payment_status === "paid") await finishPaid(row, session.payment_intent);
  else if (session.status === "expired" && row.status === "pending") await db().update(schema.bookingPayments).set({ status: "expired", sealed: "" }).where(eq(schema.bookingPayments.id, row.id));
}

/** The client is back from Stripe: confirm with Stripe and show the booking. */
export async function confirmCheckout(slug: string, sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) throw new HttpError(404, "We couldn’t find that payment.");
  const [row] = await db().select().from(schema.bookingPayments).where(eq(schema.bookingPayments.checkoutSessionId, sessionId));
  if (!row) throw new HttpError(404, "We couldn’t find that payment.");
  if (row.status === "pending" || row.status === "expired") {
    const s = await stripe<CheckoutSession>("GET", `/checkout/sessions/${sessionId}`, {}, { account: row.stripeAccountId });
    if (s.payment_status === "paid") await finishPaid(row, s.payment_intent);
  }
  const [now] = await db().select().from(schema.bookingPayments).where(eq(schema.bookingPayments.id, row.id));
  if (now.status === "expired") throw new HttpError(410, "This payment wasn’t completed in time, and the time was released. Please book again.");
  if (now.status === "pending" || !now.consultationId) return { pending: true as const };
  const { booked } = unseal<{ booked: Awaited<ReturnType<typeof createBooking>> }>(now.sealed);
  const { consultationId: _omit, ...shown } = booked;
  void _omit;
  return shown;
}

/** The client came back without paying: release the time straight away. */
export async function abandonCheckout(id: string) {
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(id)) return;
  const [row] = await db().update(schema.bookingPayments).set({ status: "expired", sealed: "" }).where(and(eq(schema.bookingPayments.id, id), eq(schema.bookingPayments.status, "pending"))).returning();
  if (row?.checkoutSessionId) await stripe("POST", `/checkout/sessions/${row.checkoutSessionId}/expire`, {}, { account: row.stripeAccountId }).catch(() => {});
}

/** File the booking in the practice and tell everyone: client, chart, session, notification, emails, invite. */
async function createBooking(b: Context, service: BookingService, input: BookingInput, start: number, paid: Paid | null) {
  const { practiceId, profile, tz } = b;
  const written = isDelivered(service.format);
  const instructions = instructionsFor(profile, service.format);
  const dueText = (zone: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(start));

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
  const builtIn = isCall(service.format) && builtInCalls(profile);
  const meetingUrl = isCall(service.format) && !builtIn && profile.meetingUrl ? profile.meetingUrl : undefined;
  const callMode = isCall(service.format) ? (service.call ?? "video") : undefined;
  const consultationId = newId("k");
  const note = [`Booked online (${service.name}).${paid ? ` Paid ${money(paid.amount, paid.currency)} online.` : ""}`, input.notes ? `Their note: ${input.notes}` : "", existing ? "" : `New client. Birth details as given: ${input.birth.date}, ${input.birth.timeAccuracy === "unknown" ? "time unknown" : input.birth.time}, ${input.birth.place}.`]
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
    ...(callMode ? { callMode } : {}),
    chartIds: chartId ? [chartId] : [],
    prepNotes: note,
    readingIds: [],
    recordingIds: [],
  });
  const { raw: token, hash: tokenHash } = newToken();
  await db().insert(schema.bookingTokens).values({ tokenHash, practiceId, consultationId, serviceId: service.id, clientEmail: input.email, clientName: name });
  const manage = link(`/book/manage/${token}`);
  // The service's intake form, filled in from the booking link (no sign-in needed).
  const form = service.intakeFormId ? (await intakeFormsOf(practiceId)).find((f) => f.id === service.intakeFormId) : undefined;
  if (form) await upsertRecord(practiceId, "intakeRequests", { ...requestFromForm(form, clientId, consultationId) });
  const formText = form ? `\n\nBefore your session, please fill in “${form.title}” (a few minutes):\n${manage}#intake\n` : "";
  await upsertRecord(practiceId, "notifications", {
    id: newId("n"),
    type: "consultation",
    title: existing ? "New booking" : "New booking from a new client",
    body: written ? `${name} ordered ${service.name}, due ${dueText(tz)}.` : `${name} booked ${service.name} for ${when(start, tz)}.`,
    at: now,
    read: false,
    href: `/app/consultations?id=${consultationId}`,
  });

  const astro = profile.displayName || b.practitioner.name || "Your astrologer";
  const owner = await ownerEmail(practiceId);
  const visitorTz = ianaZone(input.tz) || tz;
  const place = builtIn ? `${callMode === "audio" ? "Audio" : "Video"} call on AstrologersDirect: join from your booking link below (it opens 30 minutes before)` : isCall(service.format) ? (meetingUrl ? `Live session: ${meetingUrl}` : `Live session (${astro} will send the link)`) : service.format === "Phone" ? `Phone call: ${astro} will call you at ${input.phone.trim()}` : `In person${profile.location ? `: ${profile.location}` : ""}`;
  const price = paid
    ? `\nPaid: ${money(paid.amount, paid.currency)}. ${refundPolicyText(profile.refundPolicy ?? DEFAULT_REFUND_POLICY)}`
    : service.price ? `\nPrice: ${service.price} (payment arranged directly with ${astro})` : "";
  const how = instructions ? `\n\n${instructions}` : "";
  await sendMail(
    input.email,
    `Booked: ${service.name} With ${astro}`,
    written
      ? `Hi ${input.firstName},\n\nThank you for ordering a ${service.name} from ${astro}. It will be ready by ${dueText(visitorTz)}.${price}${how}${formText}\n\nNeed to cancel? Use your booking link:\n${manage}\n\nOr reply to this email.\n${profile.autoInvite && !existing ? `\nYou’ll also get an invitation to your private client portal, where your reading will be delivered.\n` : ""}`
      : `Hi ${input.firstName},\n\nYour ${service.name} with ${astro} is booked for ${when(start, visitorTz)}${visitorTz !== tz ? ` (${when(start, tz)} for ${astro})` : ""}.\n\n${service.durationMin} minutes · ${place}${price}${how}${formText}\n\nNeed to reschedule or cancel? Use your booking link${profile.rules.changeNoticeHours ? ` (up to ${noticeText(profile.rules.changeNoticeHours)} before)` : ""}:\n${manage}\n\nOr reply to this email.\n${profile.autoInvite && !existing ? `\nYou’ll also get an invitation to your private client portal, where ${astro} can share your readings.\n` : ""}`,
    owner ? { replyTo: owner } : {},
  );
  if (owner)
    await sendMail(
      owner,
      `New Booking: ${name}, ${service.name}`,
      `${name} ${written ? `ordered ${service.name}, due ${dueText(tz)}` : `booked ${service.name} for ${when(start, tz)}`}.${paid ? ` They paid ${money(paid.amount, paid.currency)}.` : ""}${input.phone.trim() ? `\nPhone: ${input.phone.trim()}` : ""}\n\n${existing ? "They’re an existing client." : "New client: their record and natal chart are ready."}${input.notes ? `\n\nTheir note:\n${input.notes}` : ""}\n\nOpen the session:\n${link(`/app/consultations?id=${consultationId}`)}\n\nReply to this email to reach them.`,
      { replyTo: input.email },
    );
  if (profile.autoInvite && (!existing || existing.portalAccess === "none")) {
    // Best effort: an address that can't be invited (e.g. a practitioner's) just isn't.
    await inviteClient({ practiceId }, clientId).catch(() => {});
  }
  return { start: new Date(start).toISOString(), service: service.name, durationMin: service.durationMin, format: service.format, written, instructions, displayName: astro, meetingUrl: meetingUrl ?? null, call: builtIn ? (callMode ?? "video") : null, manage: `/book/manage/${token}`, consultationId };
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
  const written = isDelivered(String(k.location));
  return { row, k, profile, practitioner: p, tz, start, deadline, service, written, canChange, canReschedule: canChange && profile.enabled && !!service && !written };
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
    call: usesBuiltInCall(b.k) ? (b.k.callMode === "audio" ? "audio" : "video") : null,
    canChange: b.canChange,
    canReschedule: b.canReschedule,
    deadline: new Date(b.deadline).toISOString(),
    noticeHours: b.profile.rules.changeNoticeHours,
    written: b.written,
    instructions: instructionsFor(b.profile, String(b.k.location)),
    intake: await intakeFor(b).then((r) => (r ? { title: r.title, status: r.status } : null)),
    payment: await paymentForConsultation(b.row.practiceId, b.row.consultationId).then((p) =>
      p && p.status !== "pending" && p.status !== "expired"
        ? { paid: money(p.amount, p.currency), refunded: p.refunded ? money(p.refunded, p.currency) : null, policy: refundPolicyText(b.profile.refundPolicy ?? DEFAULT_REFUND_POLICY), refundIfCanceledNow: p.refunded ? null : money(refundFor(p.amount, b.profile.refundPolicy ?? DEFAULT_REFUND_POLICY, (b.start - Date.now()) / 3_600_000), p.currency) }
        : null,
    ),
  };
}

async function intakeFor(b: Awaited<ReturnType<typeof lookup>>) {
  const reqs = await listCollection(b.row.practiceId, "intakeRequests", { clientIds: [String(b.k.clientId)] });
  return (reqs.find((r) => r.consultationId === b.row.consultationId) as unknown as IntakeRequest | undefined) ?? null;
}

/** The client joins their session's call from the booking link. */
export async function bookingCall(token: string) {
  const b = await lookup(token);
  return joinCall(b.row.practiceId, b.row.consultationId, { name: b.row.clientName || "Client", owner: false });
}

/** The booked session's intake form: what to ask, and whether it's been sent back. */
export async function bookingIntake(token: string) {
  const b = await lookup(token);
  const r = await intakeFor(b);
  if (!r) throw new HttpError(404, "There’s no form for this session.");
  const person = await getRecord(b.row.practiceId, "people", String(b.k.clientId));
  return {
    id: r.id,
    title: r.title,
    intro: r.intro ?? null,
    sections: r.sections,
    status: r.status,
    displayName: b.profile.displayName || b.practitioner.name || "Your astrologer",
    clientName: b.row.clientName,
    /** What the astrologer already has, so the client can confirm rather than retype. */
    birth: r.status === "sent" ? (person?.birth ?? null) : null,
  };
}

export async function submitBookingIntake(token: string, answers: unknown) {
  const b = await lookup(token);
  const r = await intakeFor(b);
  if (!r) throw new HttpError(404, "There’s no form for this session.");
  return submitIntake(b.row.practiceId, String(b.k.clientId), r.id, answers);
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
    { subject: `Rescheduled: ${b.k.type} With ${astro}`, body: `Hi ${b.row.clientName.split(" ")[0]},\n\nYour ${b.k.type} with ${astro} is now ${when(start, vz)}.\n\nYour booking link still works if you need to change it again:\n${link(`/book/manage/${token}`)}\n` },
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
  // Paid online: refund what the astrologer's policy gives back for this much notice.
  let refundNote = "";
  let astroRefund = "";
  const pay = await paymentForConsultation(b.row.practiceId, b.row.consultationId);
  if (pay && pay.status === "paid") {
    const due = refundFor(pay.amount, b.profile.refundPolicy ?? DEFAULT_REFUND_POLICY, (b.start - Date.now()) / 3_600_000);
    const given = due > 0 ? await refundPayment(b.row.practiceId, pay.id, due).catch((e) => { console.error("refund failed", e); return -1; }) : 0;
    if (given > 0) {
      refundNote = `\n\nA refund of ${money(given, pay.currency)} is on its way to your card. It usually arrives within 5–10 business days.`;
      astroRefund = `\n\nThey were refunded ${money(given, pay.currency)} under your cancellation policy.`;
    } else if (given === 0) {
      refundNote = `\n\nUnder ${astro}’s cancellation policy, this late cancellation isn’t refunded. ${refundPolicyText(b.profile.refundPolicy ?? DEFAULT_REFUND_POLICY)}`;
      astroRefund = `\n\nUnder your cancellation policy they weren’t refunded. You can still refund them in Settings › Payments.`;
    } else {
      refundNote = `\n\n${astro} will arrange your refund.`;
      astroRefund = `\n\nThe automatic refund didn’t go through. Please refund them in Settings › Payments.`;
    }
  }
  await tellBoth(
    b,
    { subject: `Canceled: ${b.k.type} With ${astro}`, body: `Hi ${b.row.clientName.split(" ")[0]},\n\nYour ${b.k.type} with ${astro} on ${when(b.start, b.tz)} is canceled.${refundNote}${b.profile.enabled && b.profile.slug ? `\n\nWhenever you’d like to book again:\n${link(`/book/${b.profile.slug}`)}` : ""}\n` },
    { title: "Session Canceled", body: `${b.row.clientName} canceled ${b.k.type} on ${when(b.start, b.tz)}.${why ? ` “${why.slice(0, 140)}”` : ""}`, email: `${b.row.clientName} canceled ${b.k.type} on ${when(b.start, b.tz)}.${why ? `\n\nTheir reason:\n${why}` : ""}${astroRefund}\n\nThe time is free again on your booking page.\n` },
  );
  return manageView(token);
}
