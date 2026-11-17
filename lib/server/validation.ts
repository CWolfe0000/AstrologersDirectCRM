import { z } from "zod";
import { ALLOWED_TYPES } from "@/lib/media-types";

/**
 * Runtime validation for every record written through the API. Mirrors
 * lib/data/types.ts. Strict objects: unknown keys are rejected rather than
 * silently stored.
 */
const id = z.string().min(1).max(80).regex(/^[A-Za-z0-9_\-]+$/);
const str = (max = 500) => z.string().max(max);
const iso = z.string().max(40);
const html = z.string().max(200_000);
const opt = <T extends z.ZodTypeAny>(t: T) => t.optional();
const contentType = z.enum(ALLOWED_TYPES as [string, ...string[]]);

const bodyId = z.enum(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron", "asc", "mc"]);
const aspectId = z.enum(["conjunction", "opposition", "trine", "square", "sextile", "quincunx", "semisextile", "semisquare", "sesquiquadrate"]);

export const birthSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    timeAccuracy: z.enum(["exact", "approximate", "unknown"]),
    place: str(200),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    tz: str(64),
  })
  .strict();

const orbDeg = z.number().min(0.1).max(15);
export const timelineDefaultsSchema = z
  .object({
    transits: z.boolean(),
    progressions: z.boolean(),
    solarArcs: z.boolean(),
    lunations: z.boolean(),
    transitBodies: z.array(bodyId).max(14),
    aspects: z.array(aspectId).min(1).max(9),
    orbs: z.object({ transit: orbDeg, directed: orbDeg, lunation: orbDeg, eclipse: orbDeg }).strict(),
    transitOrbs: z.record(bodyId, orbDeg),
  })
  .strict();

export const settingsSchema = z
  .object({
    houseSystem: z.enum(["placidus", "whole-sign", "koch", "equal", "porphyry", "regiomontanus", "campanus"]),
    zodiac: z.enum(["tropical", "sidereal-lahiri", "sidereal-fagan-bradley"]),
    bodies: z.array(bodyId).max(14),
    aspects: z.array(aspectId).max(9),
    orbs: z.record(aspectId, z.number().min(0).max(20)),
    showAspectLines: z.boolean(),
    showHouseCusps: z.boolean(),
    showDegrees: z.boolean(),
    timeline: timelineDefaultsSchema.optional(),
  })
  .strict();

const person = z
  .object({
    id,
    firstName: str(100).min(1),
    lastName: str(100),
    birth: birthSchema,
    clientId: opt(id),
    relationship: opt(str(80)),
    notes: opt(str(5000)),
  })
  .strict();

const client = z
  .object({
    id,
    // Practitioners may record incomplete contact details; the invite endpoint checks the address.
    email: str(200),
    phone: opt(str(60)),
    pronouns: opt(str(40)),
    status: z.enum(["active", "new", "inactive", "archived"]),
    source: opt(str(200)),
    createdAt: iso,
    tags: z.array(str(60)).max(30),
    portalAccess: z.enum(["active", "invited", "none"]),
    summary: opt(str(5000)),
  })
  .strict();

const chart = z
  .object({
    id,
    title: str(200),
    type: z.enum(["natal", "synastry", "composite", "transits", "progressions", "solar-arc", "solar-return", "horary", "astrocartography"]),
    personIds: z.array(id).min(1).max(2),
    clientId: id,
    refDate: opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    horary: opt(
      z
        .object({
          question: str(1000).min(1),
          at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
          place: str(200),
          lat: z.number().min(-90).max(90),
          lon: z.number().min(-180).max(180),
          tz: str(80),
        })
        .strict(),
    ),
    settings: opt(settingsSchema.partial()),
    createdAt: iso,
    updatedAt: iso,
    lastOpenedAt: opt(iso),
    favorite: opt(z.boolean()),
    savedConfig: opt(str(120)),
  })
  .strict();

const revision = z.object({ at: iso, summary: str(300), body: opt(html) }).strict();

const observation = z
  .object({
    id,
    title: str(300),
    body: html,
    scope: z.enum(["natal", "relationship", "timing"]),
    chartId: id,
    personIds: z.array(id).min(1).max(2),
    clientId: id,
    consultationId: opt(id),
    planets: z.array(bodyId).max(14),
    aspects: z.array(aspectId).max(9),
    houses: z.array(z.number().int().min(1).max(12)).max(12),
    tags: z.array(str(60)).max(40),
    createdAt: iso,
    updatedAt: iso,
    revisions: z.array(revision).max(500),
    pinned: opt(z.boolean()),
  })
  .strict();

const consultation = z
  .object({
    id,
    clientId: id,
    type: str(120),
    start: iso,
    durationMin: z.number().int().min(5).max(24 * 60),
    status: z.enum(["scheduled", "completed", "cancelled", "no-show"]),
    location: z.enum(["Video call", "Phone", "In person"]),
    meetingUrl: opt(z.string().max(500).regex(/^https:\/\/[^\s]+$/, "Use a full https:// link")),
    chartIds: z.array(id).max(30),
    prepNotes: opt(str(50_000)),
    sessionNotes: opt(str(50_000)),
    readingIds: z.array(id).max(50),
    recordingIds: z.array(id).max(50),
    sharedSummary: opt(str(10_000)),
  })
  .strict();

const task = z
  .object({
    id,
    title: str(300),
    description: opt(str(20_000)),
    due: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
    priority: z.enum(["high", "medium", "low"]),
    status: z.enum(["todo", "in-progress", "done"]),
    clientId: opt(id),
    consultationId: opt(id),
    chartId: opt(id),
    checklist: z.array(z.object({ id, label: str(300), done: z.boolean() }).strict()).max(100),
    files: opt(z.array(str(300)).max(50)),
    history: z.array(z.object({ at: iso, text: str(300) }).strict()).max(500),
    completedAt: opt(iso),
  })
  .strict();

const readingKind = z.enum(["pdf", "audio", "video", "document", "link"]);
const reading = z
  .object({
    id,
    clientId: id,
    chartId: opt(id),
    consultationId: opt(id),
    title: str(300),
    kind: readingKind,
    fileName: opt(str(300)),
    fileKey: opt(str(300)),
    contentType: opt(contentType),
    sizeMB: opt(z.number().min(0).max(100_000)),
    durationSec: opt(z.number().min(0).max(24 * 3600)),
    pages: opt(z.number().int().min(0).max(10_000)),
    // Only web links; blocks javascript:/data: URLs being shown to clients as links.
    url: opt(z.string().max(2000).regex(/^(https?:\/\/|[^:]*$)/i, "Links must start with https://")),
    message: str(10_000),
    status: z.enum(["draft", "ready", "delivered", "failed"]),
    createdAt: iso,
    deliveredAt: opt(iso),
    allowDownload: z.boolean(),
    expiresAt: opt(iso),
    notification: z.enum(["pending", "sent", "opened", "failed"]),
    openedAt: opt(iso),
    attachments: opt(z.array(z.object({ name: str(300), kind: readingKind, sizeMB: opt(z.number()) }).strict()).max(30)),
    failureReason: opt(str(500)),
  })
  .strict();

const recording = z
  .object({
    id,
    clientId: id,
    chartId: opt(id),
    title: str(300),
    mode: z.enum(["audio", "webcam", "screen", "screen-webcam"]),
    durationSec: z.number().min(0).max(24 * 3600),
    createdAt: iso,
    status: z.enum(["saved", "delivered"]),
    readingId: opt(id),
    fileKey: opt(str(300)),
    contentType: opt(contentType),
  })
  .strict();

const file = z
  .object({
    id,
    clientId: id,
    name: str(300),
    kind: z.enum(["pdf", "image", "doc", "audio", "other"]),
    sizeKB: z.number().min(0).max(10_000_000),
    uploadedAt: iso,
    private: z.boolean(),
    note: opt(str(2000)),
    fileKey: opt(str(300)),
    contentType: opt(contentType),
  })
  .strict();

const notification = z
  .object({
    id,
    type: z.enum(["consultation", "client", "delivery", "upload", "task", "account"]),
    title: str(300),
    body: str(2000),
    at: iso,
    read: z.boolean(),
    href: opt(str(500)),
  })
  .strict();

const activity = z
  .object({
    id,
    kind: z.enum(["observation", "chart", "reading", "consultation", "client", "task", "recording"]),
    text: str(500),
    at: iso,
    clientId: opt(id),
    href: opt(str(500)),
  })
  .strict();

const portalNotification = z
  .object({ id, clientId: opt(id), title: str(300), body: str(2000), at: iso, read: z.boolean(), href: opt(str(500)) })
  .strict();

export const practitionerSchema = z
  .object({
    name: str(120),
    firstName: str(80),
    title: str(120),
    email: str(200),
    phone: str(60),
    practice: str(160),
    website: str(200),
    timezone: str(120),
    bio: str(5000),
    plan: str(80),
    reminders: opt(z.object({ clients: z.boolean(), hoursBefore: z.number().int().min(1).max(168) }).strict()),
    portalAccent: opt(z.enum(["#824B59", "#5E7266", "#4D5A70", "#7A6145", "#29272B"])),
    workTemplates: opt(
      z
        .array(z.object({ id, kind: z.enum(["assignment", "journal", "goal", "activity"]), title: str(200).min(1), instructions: str(10_000) }).strict())
        .max(50),
    ),
  })
  .strict();

const clientWork = z
  .object({
    id,
    clientId: id,
    kind: z.enum(["assignment", "journal", "goal", "activity"]),
    title: str(200).min(1),
    instructions: str(10_000),
    dueDate: opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    remind: opt(z.boolean()),
    consultationId: opt(id),
    status: z.enum(["draft", "shared", "completed", "archived"]),
    sharedAt: opt(iso),
    completedAt: opt(iso),
    createdAt: iso,
    updatedAt: iso,
  })
  .strict();

export const workResponse = z
  .object({
    id,
    workId: id,
    clientId: id,
    type: z.enum(["entry", "done", "undone"]),
    text: opt(str(10_000)),
    createdAt: iso,
  })
  .strict();

export const COLLECTION_SCHEMAS = {
  people: person,
  clients: client,
  charts: chart,
  observations: observation,
  consultations: consultation,
  tasks: task,
  readings: reading,
  recordings: recording,
  files: file,
  notifications: notification,
  activity: activity,
  portalNotifications: portalNotification,
  clientWork,
  workResponses: workResponse,
} as const;
