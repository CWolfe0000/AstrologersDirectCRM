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
  format: "Video call" | "Phone" | "In person";
  active: boolean;
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
};

/** Public booking page address: lowercase letters, numbers and hyphens. */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
export const RESERVED_SLUGS = new Set(["admin", "api", "app", "auth", "book", "portal", "help", "support", "about", "pricing", "contact", "features", "login", "signup", "settings", "astrologersdirect"]);
