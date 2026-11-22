/**
 * How a session happens. Stored values keep their original spelling (existing
 * records use them); `label` is what people see. "Phone" and "In person" are no
 * longer offered but stay valid for services and sessions already set up that way.
 */
export const SESSION_FORMATS = ["Video call", "Audio call", "Phone", "Written reading", "In person"] as const;
export type SessionFormat = (typeof SESSION_FORMATS)[number];
/** The formats offered for new services and sessions. */
export const OFFERED_FORMATS: SessionFormat[] = ["Video call", "Audio call", "Written reading"];
/** Formats where the client joins a call by link (the astrologer's meeting room). */
export const isCall = (f: string) => f === "Video call" || f === "Audio call";

export const FORMAT_LABEL: Record<SessionFormat, string> = { "Video call": "Video Call", "Audio call": "Audio Call", Phone: "Phone", "Written reading": "Written Reading", "In person": "In Person" };
export const formatLabel = (f: string) => FORMAT_LABEL[f as SessionFormat] ?? f;
/** A written reading is delivered, not met for: no time slot, a delivery date instead. */
export const isWritten = (f: string) => f === "Written reading";

/** Starting instructions for each format; the astrologer rewrites them in Settings › Booking. */
export const DEFAULT_INSTRUCTIONS: Record<"Video call" | "Audio call" | "Phone" | "Written reading", string> = {
  "Video call": "Join from the video link a few minutes before we start. A quiet space and headphones help.",
  "Audio call": "Join from the call link a few minutes before we start. It’s audio only, so no camera is needed. A quiet space and headphones help.",
  Phone: "I’ll call you at the number you gave when booking. Please be somewhere you can talk freely.",
  "Written reading": "Your written reading will arrive in your client portal by the date shown. You’ll get an email when it’s ready.",
};
/** Written readings are delivered within one of these. */
export const DELIVERY_DAYS = [3, 5, 7, 10, 14, 21, 30];
