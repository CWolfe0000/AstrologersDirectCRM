import type { BirthData, BodyId, AspectId, ChartSettings } from "@/lib/astro/types";
import type { LifeEvent } from "@/lib/life-events";
export type { LifeEvent };

export type ClientStatus = "active" | "new" | "inactive" | "archived";

/** A person whose birth data may be charted: a client or someone associated with a client. */
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birth: BirthData;
  /** When this person is an associated person, the client they belong to. */
  clientId?: string;
  relationship?: string; // "Partner", "Mother", …
  notes?: string;
  birthCircumstances?: string[];
  /** Dated life events and periods: for the timeline and rectification. */
  lifeEvents?: LifeEvent[];
}

export interface Client {
  id: string; // also the client's Person id
  email: string;
  phone?: string;
  pronouns?: string;
  status: ClientStatus;
  source?: string;
  createdAt: string;
  tags: string[];
  portalAccess: "active" | "invited" | "none";
  summary?: string;
}

export type ChartType = "natal" | "synastry" | "composite" | "davison" | "transits" | "progressions" | "solar-arc" | "solar-return" | "lunar-return" | "planetary-return" | "horary" | "astrocartography" | "election";

/** An elected moment: what it's for, when and where, and the rules it was chosen by. */
export interface ElectionData {
  purpose: string;
  event: "general" | "contract" | "relationship" | "launch" | "travel" | "move";
  /** Local date and time, YYYY-MM-DDTHH:mm. */
  at: string;
  place: string;
  lat: number;
  lon: number;
  tz: string;
  checks: string[];
  /** Whether the client's natal chart was part of the choice. */
  useNatal: boolean;
  eclipseNear?: string;
}

/** The question and the moment and place it was asked (horary charts). */
export interface HoraryData {
  question: string;
  /** Local date and time the question was asked, YYYY-MM-DDTHH:mm. */
  at: string;
  place: string;
  lat: number;
  lon: number;
  tz: string;
  /** What the question is about (a house topic) and whose matter it is: the quesited is the topic's house counted from that person's house. */
  topicHouse?: number;
  aboutHouse?: number;
  /** The astrologer's judgment, and what actually happened. */
  judgment?: string;
  outcome?: "pending" | "yes" | "no" | "partly";
  outcomeNote?: string;
  outcomeAt?: string;
}

export interface ChartRecord {
  id: string;
  title: string;
  type: ChartType;
  /** People charted. natal/progressions/solar-arc: [person]; synastry/composite: [inner, outer]; transits: [person]. */
  personIds: string[];
  /** The client record this chart is filed under. */
  clientId: string;
  /** Reference date for timing charts (transits/progressions/solar arc/solar return). */
  refDate?: string;
  /** Horary charts: the question, and when and where it was asked. personIds holds the querent. */
  horary?: HoraryData;
  /** Electional charts: the chosen moment and how it was chosen. personIds holds the client. */
  election?: ElectionData;
  /** Planetary returns: the returning planet. */
  returnBody?: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "chiron" | "node";
  /** Returns cast for somewhere other than the birthplace (relocated returns). */
  returnPlace?: { place: string; lat: number; lon: number; tz: string };
  settings?: Partial<ChartSettings>;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  favorite?: boolean;
  savedConfig?: string; // name of saved display configuration
  /** Shared with the client: a snapshot of the calculated chart, shown read-only in their portal. */
  shared?: { at: string; view: { type: string; inner: import("@/lib/astro/types").ChartPoints; outer?: import("@/lib/astro/types").ChartPoints; aspects: import("@/lib/astro/types").Aspect[] } };
}

/**
 * Observation scope enforces the data rule:
 *  - natal: belongs to ONE person's natal chart
 *  - relationship: belongs to a specific synastry/composite chart context
 *  - timing: belongs to a transit/progression/solar-arc chart for a period
 */
export type ObservationScope = "natal" | "relationship" | "timing";

export interface Revision {
  at: string;
  summary: string;
  body?: string;
}

export interface Observation {
  id: string;
  title: string;
  body: string; // simple HTML
  scope: ObservationScope;
  chartId: string;
  personIds: string[]; // whose chart(s) it interprets
  clientId: string;
  consultationId?: string;
  planets: BodyId[];
  aspects: AspectId[];
  houses: number[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  revisions: Revision[];
  pinned?: boolean;
}

export type ConsultationStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export interface Consultation {
  id: string;
  clientId: string;
  type: string;
  start: string;
  durationMin: number;
  status: ConsultationStatus;
  location: "Live session" | "Recorded reading" | "Written reading" | "Video call" | "Audio call" | "Phone" | "In person";
  /** Video call link (Zoom, Meet…) the client joins from their portal and reminder email. */
  meetingUrl?: string;
  chartIds: string[];
  prepNotes?: string;
  sessionNotes?: string;
  readingIds: string[];
  recordingIds: string[];
  /** Material marked as shared with the client (visible in the portal). */
  sharedSummary?: string;
}

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  due: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  clientId?: string;
  consultationId?: string;
  chartId?: string;
  checklist: { id: string; label: string; done: boolean }[];
  files?: string[];
  history: { at: string; text: string }[];
  completedAt?: string;
}

export type ReadingKind = "pdf" | "audio" | "video" | "document" | "link";
export type DeliveryStatus = "draft" | "ready" | "delivered" | "failed";

export interface Reading {
  id: string;
  clientId: string;
  chartId?: string;
  consultationId?: string;
  title: string;
  kind: ReadingKind;
  fileName?: string;
  /** Stored object (server mode). Absent for links and for sample data. */
  fileKey?: string;
  contentType?: string;
  sizeMB?: number;
  durationSec?: number;
  pages?: number;
  url?: string;
  message: string;
  status: DeliveryStatus;
  createdAt: string;
  deliveredAt?: string;
  allowDownload: boolean;
  expiresAt?: string;
  notification: "pending" | "sent" | "opened" | "failed";
  openedAt?: string;
  attachments?: { name: string; kind: ReadingKind; sizeMB?: number }[];
  failureReason?: string;
}

export type RecordingMode = "audio" | "webcam" | "screen" | "screen-webcam";

export interface Recording {
  id: string;
  clientId: string;
  chartId?: string;
  title: string;
  mode: RecordingMode;
  durationSec: number;
  createdAt: string;
  status: "saved" | "delivered";
  readingId?: string;
  /** Stored recording (server mode, real devices). */
  fileKey?: string;
  contentType?: string;
}

export interface ClientFile {
  id: string;
  clientId: string;
  name: string;
  kind: "pdf" | "image" | "doc" | "audio" | "other";
  sizeKB: number;
  uploadedAt: string;
  private: boolean;
  note?: string;
  /** Stored object (server mode). Absent for sample data. */
  fileKey?: string;
  contentType?: string;
}

export type NotificationType = "consultation" | "client" | "delivery" | "upload" | "task" | "account";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
}

export type ActivityKind = "observation" | "chart" | "reading" | "consultation" | "client" | "task" | "recording";

export interface Activity {
  id: string;
  kind: ActivityKind;
  text: string;
  at: string;
  clientId?: string;
  href?: string;
}

export interface Practitioner {
  /** Portal only: the astrologer's public booking page, when online booking is on. */
  bookingUrl?: string;
  name: string;
  firstName: string;
  title: string;
  email: string;
  phone: string;
  practice: string;
  website: string;
  timezone: string;
  bio: string;
  plan: string;
  /** Automatic consultation reminder emails to clients. */
  reminders?: { clients: boolean; hoursBefore: number };
  /** Accent color for this practice's client portal (one of PORTAL_ACCENTS). */
  portalAccent?: string;
  /** Reusable Between Sessions items. */
  workTemplates?: WorkTemplate[];
  /** The practice's intake forms (as many as the astrologer likes). */
  intakeForms?: IntakeForm[];
  /** First-run setup: set at sign-up; `done` once finished or dismissed. */
  onboarding?: { step: number; done: boolean };
}

/**
 * One part of an intake form. The built-in parts (birth details, contact
 * details, goals, life events) appear at most once; custom questions as often
 * as the astrologer likes.
 */
export type IntakeSectionKind = "birth" | "contact" | "goals" | "lifeEvents" | "horary" | "question";
export type IntakeAnswerKind = "short" | "long" | "choice" | "multi" | "date";
export interface IntakeSection {
  id: string;
  kind: IntakeSectionKind;
  /** The question or heading (custom questions; built-in parts have a default). */
  label?: string;
  help?: string;
  required?: boolean;
  /** Custom questions: how they're answered, and the choices. */
  answer?: IntakeAnswerKind;
  options?: string[];
}
export interface IntakeForm {
  id: string;
  title: string;
  /** Shown to the client above the form. */
  intro?: string;
  sections: IntakeSection[];
  updatedAt: string;
}

/** What a client sends back. */
export interface IntakeAnswers {
  birth?: { date: string; time?: string; timeAccuracy: "exact" | "approximate" | "unknown"; timeSource?: string; place: string; lat: number; lon: number; tz: string };
  contact?: { preferredName?: string; pronouns?: string; phone?: string };
  goals?: string;
  lifeEvents?: LifeEvent[];
  /** A horary question and the moment and place it was asked (local time). */
  horary?: { question: string; date: string; time: string; place: string; lat: number; lon: number; tz: string };
  /** Custom questions, by section id. */
  questions?: Record<string, string | string[]>;
}

/** An intake form sent to one client: a copy of the form as it was when sent, and their answers. */
export interface IntakeRequest {
  id: string;
  clientId: string;
  formId: string;
  title: string;
  intro?: string;
  sections: IntakeSection[];
  status: "sent" | "submitted";
  /** Sent because the client booked this session. */
  consultationId?: string;
  sentAt: string;
  submittedAt?: string;
  answers?: IntakeAnswers;
  /** What was copied into the client record on submission, and what's waiting for the astrologer. */
  applied?: { birth?: "applied" | "review" | "dismissed"; events?: number; contact?: boolean; chartId?: string };
  createdAt: string;
  updatedAt: string;
}

/** A saved starting point for between-session work. */
export interface WorkTemplate {
  id: string;
  kind: WorkKind;
  title: string;
  instructions: string;
}

export interface PortalNotification {
  id: string;
  /** The client this notification is for. */
  clientId?: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
}

/**
 * Between-session work the practitioner shares with a client: an assignment, a
 * journaling prompt, a goal or a follow-up activity. Drafts and archived items
 * never reach the portal.
 */
export type WorkKind = "assignment" | "journal" | "goal" | "activity";
export type WorkStatus = "draft" | "shared" | "completed" | "archived";

export interface ClientWork {
  id: string;
  clientId: string;
  kind: WorkKind;
  title: string;
  /** Instructions or prompt shown to the client (plain text). */
  instructions: string;
  dueDate?: string; // YYYY-MM-DD
  /** Email the client a reminder the day before the suggested date (portal clients only). */
  remind?: boolean;
  consultationId?: string;
  status: WorkStatus;
  sharedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Written by the client in their portal (never by the practitioner): a response
 * or journal entry, or marking the work done / not done.
 */
export interface WorkResponse {
  id: string;
  workId: string;
  clientId: string;
  type: "entry" | "done" | "undone";
  text?: string;
  createdAt: string;
}
