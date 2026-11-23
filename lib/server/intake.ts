import "server-only";
import { HttpError } from "./http";
import { getRecord, getSettings, upsertRecord } from "./records";
import { intakeAnswers } from "./validation";
import { newId } from "./crypto";
import { link, sendMail } from "./mail";
import { clientUserFor } from "./clientaccess";
import { inviteClient } from "./invite";
import { nowLocal } from "@/lib/utils";
import type { IntakeAnswers, IntakeForm, IntakeRequest, IntakeSection, LifeEvent } from "@/lib/data/types";
import type { BirthData } from "@/lib/astro/types";

type Rec = Record<string, unknown>;

/** A copy of a form, as it is when it's sent (later edits to the form don't change what a client was asked). */
export function requestFromForm(form: IntakeForm, clientId: string, consultationId?: string): IntakeRequest {
  const now = nowLocal();
  return {
    id: newId("iq"),
    clientId,
    formId: form.id,
    title: form.title,
    ...(form.intro ? { intro: form.intro } : {}),
    sections: form.sections,
    status: "sent",
    ...(consultationId ? { consultationId } : {}),
    sentAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export async function intakeFormsOf(practiceId: string): Promise<IntakeForm[]> {
  const s = await getSettings(practiceId);
  return ((s?.practitioner as Rec | undefined)?.intakeForms as IntakeForm[] | undefined) ?? [];
}

/** Tell the client a form is waiting: in their portal (and by email), or with a portal invitation. */
export async function notifyIntake(practiceId: string, requestId: string) {
  const req = (await getRecord(practiceId, "intakeRequests", requestId)) as unknown as IntakeRequest | null;
  if (!req) throw new HttpError(404, "Form not found.");
  if (req.status !== "sent") throw new HttpError(409, "This form has already been filled in.");
  const client = await getRecord(practiceId, "clients", req.clientId);
  const person = await getRecord(practiceId, "people", req.clientId);
  if (!client || !person) throw new HttpError(404, "Client not found.");
  const s = await getSettings(practiceId);
  const p = (s?.practitioner ?? {}) as { name?: string; firstName?: string };
  const astrologer = p.name ?? "Your astrologer";
  const u = await clientUserFor(practiceId, req.clientId);
  if (client.portalAccess === "active" && u) {
    await upsertRecord(practiceId, "portalNotifications", { id: newId("pn"), clientId: req.clientId, title: `Please Fill In “${req.title}”`, body: `${p.firstName ?? astrologer} sent you a form to fill in.`, at: nowLocal(), read: false, href: `/portal/forms/${req.id}` });
    if (u.emailVerifiedAt)
      await sendMail(u.email, `${astrologer} Sent You a Form: ${req.title}`, `Hi ${person.firstName},\n\n${astrologer} asked you to fill in “${req.title}”. It takes a few minutes and helps make the most of your time together.\n\nFill it in from your client portal:\n${link(`/portal/forms/${encodeURIComponent(`${practiceId}~${req.id}`)}`)}\n`);
    return { via: "portal" as const };
  }
  await inviteClient({ practiceId }, req.clientId, `${astrologer} also asked you to fill in “${req.title}”. You’ll find it on your portal’s home page.`);
  return { via: "invite" as const };
}

// ——— Submitting ————————————————————————————————————————————————

const has = (sections: IntakeSection[], kind: IntakeSection["kind"]) => sections.find((s) => s.kind === kind);

/** Keep only what the form asked for, and check the required parts are there. */
function checkAnswers(sections: IntakeSection[], raw: unknown): IntakeAnswers {
  const parsed = intakeAnswers.safeParse(raw);
  if (!parsed.success) throw new HttpError(422, "Please check your answers and try again.");
  const a = parsed.data as IntakeAnswers;
  const out: IntakeAnswers = {};
  const birth = has(sections, "birth"), contact = has(sections, "contact"), goals = has(sections, "goals"), events = has(sections, "lifeEvents"), horary = has(sections, "horary");
  if (birth && a.birth) out.birth = { ...a.birth, ...(a.birth.timeAccuracy === "unknown" ? { time: undefined } : {}) };
  if (birth?.required && !out.birth) throw new HttpError(422, "Please add your birth details.");
  if (out.birth && out.birth.timeAccuracy !== "unknown" && !out.birth.time) throw new HttpError(422, "Add your birth time, or choose “I don’t know my birth time”.");
  if (contact && a.contact) out.contact = a.contact;
  if (goals && a.goals?.trim()) out.goals = a.goals.trim();
  if (goals?.required && !out.goals) throw new HttpError(422, "Please tell your astrologer what you’d like to explore.");
  if (events && a.lifeEvents?.length) out.lifeEvents = a.lifeEvents.map((e) => ({ ...e, note: e.note?.trim() || undefined, source: "client" as const }));
  if (events?.required && !out.lifeEvents?.length) throw new HttpError(422, "Please add at least one life event.");
  if (horary && a.horary) out.horary = { ...a.horary, question: a.horary.question.trim() };
  if (horary && !out.horary?.question) throw new HttpError(422, "Please write your question.");
  const qs: Record<string, string | string[]> = {};
  for (const s of sections.filter((x) => x.kind === "question")) {
    const v = a.questions?.[s.id];
    const clean = Array.isArray(v) ? v.filter((x) => (s.options ?? []).includes(x)) : typeof v === "string" ? v.trim() : "";
    if (s.answer === "choice" && typeof clean === "string" && clean && !(s.options ?? []).includes(clean)) throw new HttpError(422, "Please check your answers and try again.");
    if (s.answer === "date" && typeof clean === "string" && clean && !/^\d{4}-\d{2}-\d{2}$/.test(clean)) throw new HttpError(422, "Please check the dates in your answers.");
    if (s.required && (Array.isArray(clean) ? !clean.length : !clean)) throw new HttpError(422, `Please answer “${s.label ?? "every required question"}”.`);
    if (Array.isArray(clean) ? clean.length : clean) qs[s.id] = clean;
  }
  if (Object.keys(qs).length) out.questions = qs;
  return out;
}

const sameBirth = (a: Partial<BirthData>, b: NonNullable<IntakeAnswers["birth"]>) =>
  a.date === b.date && (b.timeAccuracy === "unknown" ? a.timeAccuracy === "unknown" : a.time === b.time) && Math.abs((a.lat ?? 999) - b.lat) < 0.05 && Math.abs((a.lon ?? 999) - b.lon) < 0.05;

/**
 * Save a client's answers and file them: life events go straight onto their
 * record (marked as theirs); birth details fill in a record that has none or
 * only lacks the time, otherwise they wait for the astrologer to review;
 * contact details fill empty fields only. A horary question becomes a chart.
 */
export async function submitIntake(practiceId: string, clientId: string, requestId: string, raw: unknown) {
  const req = (await getRecord(practiceId, "intakeRequests", requestId)) as unknown as IntakeRequest | null;
  if (!req || req.clientId !== clientId) throw new HttpError(404, "Form not found.");
  if (req.status === "submitted") throw new HttpError(409, "You’ve already sent this form. Message your astrologer if something needs changing.");
  const answers = checkAnswers(req.sections, raw);
  const person = await getRecord(practiceId, "people", clientId);
  const client = await getRecord(practiceId, "clients", clientId);
  if (!person || !client) throw new HttpError(404, "Form not found.");
  const now = nowLocal();
  const applied: NonNullable<IntakeRequest["applied"]> = {};

  // Life events.
  let nextPerson: Rec = person;
  if (answers.lifeEvents?.length) {
    const existing = (person.lifeEvents as LifeEvent[] | undefined) ?? [];
    const key = (e: LifeEvent) => `${e.type}|${e.date}|${e.end ?? ""}`;
    const known = new Set(existing.map(key));
    const added = answers.lifeEvents.filter((e) => !known.has(key(e))).map((e) => ({ ...e, id: newId("ev") }));
    nextPerson = { ...nextPerson, lifeEvents: [...existing, ...added].slice(0, 200) };
    applied.events = added.length;
  }
  // Birth details.
  if (answers.birth) {
    const b = answers.birth;
    const cur = person.birth as Partial<BirthData> | undefined;
    const incoming: BirthData = { date: b.date, time: b.time ?? "12:00", timeAccuracy: b.timeAccuracy, place: b.place, lat: b.lat, lon: b.lon, tz: b.tz };
    if (!cur?.date) {
      nextPerson = { ...nextPerson, birth: incoming };
      applied.birth = "applied";
    } else if (sameBirth(cur, b)) applied.birth = "applied";
    else if (cur.timeAccuracy === "unknown" && b.timeAccuracy !== "unknown" && cur.date === b.date && Math.abs((cur.lat ?? 999) - b.lat) < 0.05 && Math.abs((cur.lon ?? 999) - b.lon) < 0.05) {
      // Same day and place, and now a time: fill it in.
      nextPerson = { ...nextPerson, birth: { ...cur, time: incoming.time, timeAccuracy: incoming.timeAccuracy } };
      applied.birth = "applied";
    } else applied.birth = "review";
  }
  if (nextPerson !== person) await upsertRecord(practiceId, "people", nextPerson);
  // Contact details: only fill what's empty.
  if (answers.contact) {
    const patch: Rec = {};
    if (answers.contact.phone?.trim() && !client.phone) patch.phone = answers.contact.phone.trim();
    if (answers.contact.pronouns?.trim() && !client.pronouns) patch.pronouns = answers.contact.pronouns.trim();
    if (Object.keys(patch).length) await upsertRecord(practiceId, "clients", { ...client, ...patch });
    applied.contact = true;
  }
  // A horary question: chart it for the moment and place it was asked.
  if (answers.horary) {
    const h = answers.horary;
    const chartId = newId("ch");
    const short = h.question.length > 60 ? `${h.question.slice(0, 57)}…` : h.question;
    await upsertRecord(practiceId, "charts", { id: chartId, title: `Horary — ${short}`, type: "horary", personIds: [clientId], clientId, horary: { question: h.question, at: `${h.date}T${h.time}`, place: h.place, lat: h.lat, lon: h.lon, tz: h.tz, outcome: "pending" }, createdAt: now, updatedAt: now });
    applied.chartId = chartId;
  }

  await upsertRecord(practiceId, "intakeRequests", { ...req, status: "submitted", submittedAt: now, answers, applied, updatedAt: now });

  // Tell the astrologer.
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "A client";
  const bits = [applied.events ? `${applied.events} life event${applied.events === 1 ? "" : "s"} added` : "", applied.birth === "review" ? "birth details to review" : "", applied.chartId ? "horary chart ready" : ""].filter(Boolean);
  const href = `/app/clients/${clientId}?tab=forms&form=${req.id}`;
  await upsertRecord(practiceId, "notifications", { id: newId("n"), type: "client", title: "Intake Form Received", body: `${name} filled in “${req.title}”${bits.length ? ` (${bits.join(", ")})` : ""}.`, at: now, read: false, href });
  const s = await getSettings(practiceId);
  const pr = (s?.practitioner ?? {}) as { email?: string };
  const to = pr.email?.includes("@") ? pr.email : null;
  if (to) await sendMail(to, `${name} Filled In “${req.title}”`, `${name} filled in “${req.title}”.${bits.length ? `\n\n${bits.map((b) => `• ${b[0]!.toUpperCase()}${b.slice(1)}`).join("\n")}` : ""}\n\nSee their answers:\n${link(href)}\n`);
  return { ok: true, applied };
}

