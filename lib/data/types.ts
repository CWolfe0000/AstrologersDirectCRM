import type { BirthData, BodyId, AspectId, ChartSettings } from "@/lib/astro/types";

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
  location: "Video call" | "Phone" | "In person";
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
