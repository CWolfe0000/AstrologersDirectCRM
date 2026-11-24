/**
 * How a reading reaches the client. Stored values keep their original spelling
 * (existing records use them); labels are what people see.
 *
 * Offered now: a Live Session (an online call, camera on or off), a Recorded
 * Reading (audio or video, delivered to the portal) and a Written Reading.
 * "Video call" and "Audio call" were live sessions under earlier names and show
 * as Live Session; "Phone" and "In person" are no longer offered but stay valid.
 */
export const SESSION_FORMATS = ["Live session", "Recorded reading", "Written reading", "Video call", "Audio call", "Phone", "In person"] as const;
export type SessionFormat = (typeof SESSION_FORMATS)[number];
/** The formats offered for new services and sessions. */
export const OFFERED_FORMATS: SessionFormat[] = ["Live session", "Recorded reading", "Written reading"];
/** Recorded readings are audio or video. */
export type RecordingKind = "audio" | "video";

/** Formats where the client joins a call by link (the astrologer's meeting room). */
export const isCall = (f: string) => f === "Live session" || f === "Video call" || f === "Audio call";
/** Delivered rather than met for: no time slot, a ready-by date instead. */
export const isDelivered = (f: string) => f === "Written reading" || f === "Recorded reading";
/** The current name for a format saved under an earlier one. */
export const currentFormat = (f: string): SessionFormat => (f === "Video call" || f === "Audio call" ? "Live session" : (f as SessionFormat));

export const FORMAT_LABEL: Record<SessionFormat, string> = {
  "Live session": "Live Session",
  "Recorded reading": "Recorded Reading",
  "Written reading": "Written Reading",
  "Video call": "Live Session",
  "Audio call": "Live Session",
  Phone: "Phone",
  "In person": "In Person",
};
/** "Live Session", "Recorded Reading (Audio)", "Written Reading". */
export const formatLabel = (f: string, kind?: RecordingKind) =>
  (FORMAT_LABEL[f as SessionFormat] ?? f) + ((f === "Recorded reading" || isCall(f)) && kind ? ` (${kind === "video" ? "Video" : "Audio"})` : "");

/** Starting instructions for each format; the astrologer rewrites them in Settings › Booking. */
export const DEFAULT_INSTRUCTIONS: Record<"Live session" | "Recorded reading" | "Written reading" | "Phone", string> = {
  "Live session": "Join from the call link a few minutes before we start. Camera on or off, whatever you prefer. A quiet space and headphones help.",
  "Recorded reading": "I’ll record your reading and it will arrive in your client portal by the date shown, to watch or listen to whenever you like. You’ll get an email when it’s ready.",
  "Written reading": "Your written reading will arrive in your client portal by the date shown. You’ll get an email when it’s ready.",
  Phone: "I’ll call you at the number you gave when booking. Please be somewhere you can talk freely.",
};
/** The instructions key for a format (earlier call names use the Live Session instructions). */
export const instructionsKey = (f: string) => {
  const c = currentFormat(f);
  return c in DEFAULT_INSTRUCTIONS ? (c as keyof typeof DEFAULT_INSTRUCTIONS) : null;
};
/** Delivered readings are ready within one of these. */
export const DELIVERY_DAYS = [3, 5, 7, 10, 14, 21, 30];
