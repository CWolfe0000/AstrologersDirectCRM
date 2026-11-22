/** Online booking: an astrologer's public profile, services, hours and rules. */

export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export const DAYS: { id: Day; label: string }[] = [
  { id: "mon", label: "Monday" }, { id: "tue", label: "Tuesday" }, { id: "wed", label: "Wednesday" }, { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" }, { id: "sat", label: "Saturday" }, { id: "sun", label: "Sunday" },
];
export type TimeRange = { start: string; end: string }; // "HH:mm" local to the astrologer

export interface BookingService {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  /** Shown as written, e.g. "$150". Payment is arranged directly for now. */
  price: string;
  format: "Video call" | "Audio call" | "Phone" | "Written reading" | "In person";
  /** Written readings: delivered within this many days (instead of a time slot). */
  deliveryDays?: number;
  active: boolean;
  /** The intake form sent to whoever books this service. */
  intakeFormId?: string;
}

export interface BookingRules {
  weekly: Record<Day, TimeRange[]>;
  /** Free time kept before and after every session. */
  bufferMin: number;
  /** How soon the earliest booking can be. */
  minNoticeHours: number;
  /** How far ahead clients can book. */
  maxAdvanceDays: number;
  /** Start times are offered on this grid (minutes). */
  stepMin: number;
  /** Clients can reschedule or cancel online until this many hours before the session. */
  changeNoticeHours: number;
}

export interface BookingProfile {
  slug: string;
  enabled: boolean;
  displayName: string;
  headline: string;
  about: string;
  /** Where in-person sessions happen (shown on the public page). */
  location: string;
  /** Sent with video-call bookings (Zoom, Meet…). */
  meetingUrl: string;
  services: BookingService[];
  rules: BookingRules;
  /** Invite new clients to their portal when they book. */
  autoInvite: boolean;
  /** Profile photo: a small square image, stored as a data URL. */
  photo?: string;
  /** What clients need to know for each format (sent with the booking and shown on their booking page). */
  instructions?: { "Video call"?: string; "Audio call"?: string; Phone?: string; "Written reading"?: string };
  /** Let search engines list the page (off: reachable by link only). */
  searchable?: boolean;
  /** Links shown under the name, link-in-bio style (website, Instagram, newsletter…). */
  links?: { label: string; url: string }[];
}

export const DEFAULT_RULES: BookingRules = {
  weekly: {
    mon: [{ start: "09:00", end: "17:00" }], tue: [{ start: "09:00", end: "17:00" }], wed: [{ start: "09:00", end: "17:00" }],
    thu: [{ start: "09:00", end: "17:00" }], fri: [{ start: "09:00", end: "17:00" }], sat: [], sun: [],
  },
  bufferMin: 15,
  minNoticeHours: 24,
  maxAdvanceDays: 60,
  stepMin: 30,
  changeNoticeHours: 24,
};

/** Public booking page address: lowercase letters, numbers and hyphens. */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
/** Addresses that are (or may become) the website's own pages: profiles also live at astrologersdirect.com/<address>. */
export const RESERVED_SLUGS = new Set([
  "admin", "manage", "api", "app", "auth", "book", "portal", "help", "support", "about", "pricing", "contact", "features", "login", "signup", "settings", "astrologersdirect",
  "how-it-works", "legal", "request-access", "privacy", "terms", "blog", "faq", "docs", "status", "careers", "press", "news", "directory", "astrologers", "search",
  "icons", "screenshots", "offline", "manifest", "robots", "sitemap", "favicon", "www", "mail", "beta", "demo", "home", "account", "billing",
]);
