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

export type ChartType = "natal" | "synastry" | "composite" | "transits" | "progressions" | "solar-arc" | "solar-return";

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
}

export interface PortalNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
}
