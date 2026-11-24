import "server-only";
import { HttpError } from "./http";
import { sha256 } from "./crypto";
import { getRecord, getSettings } from "./records";
import { ianaZone, zonedToUtc } from "@/lib/timezones";
import { isCall } from "@/lib/booking/formats";

/**
 * Live sessions inside AstrologersDirect, on Daily (daily.co). Each session
 * gets a private room; whoever joins gets a short-lived pass (meeting token),
 * the astrologer as the room's owner.
 *   DAILY_API_KEY    from the Daily dashboard (unset: live sessions use the astrologer's own link)
 *   DAILY_API_BASE   tests only: a stand-in for api.daily.co
 */
export const callsEnabled = () => !!process.env.DAILY_API_KEY;

async function daily<T = Record<string, unknown>>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new HttpError(503, "Calls aren’t set up yet.");
  const base = (process.env.DAILY_API_BASE || "https://api.daily.co/v1").replace(/\/$/, "");
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; info?: string };
  if (!res.ok) {
    const err = new HttpError(res.status === 404 ? 404 : 502, data.info || data.error || `Calls error ${res.status}`);
    throw err;
  }
  return data;
}

/** Joining opens this long before the start (clients) and closes this long after the end. */
const EARLY_MIN = 30;
const LATE_MIN = 180;

/** A session that happens on a built-in call: a live format with no outside link. */
export function usesBuiltInCall(k: Record<string, unknown>) {
  return callsEnabled() && isCall(String(k.location)) && !k.meetingUrl;
}

/** The session, its times in UTC and whether it can be joined now. */
async function sessionFor(practiceId: string, consultationId: string) {
  const k = await getRecord(practiceId, "consultations", consultationId);
  if (!k) throw new HttpError(404, "This session no longer exists.");
  if (!usesBuiltInCall(k)) throw new HttpError(409, "This session doesn’t take place on an AstrologersDirect call.");
  if (k.status !== "scheduled") throw new HttpError(409, k.status === "cancelled" ? "This session was canceled." : "This session has ended.");
  const p = ((await getSettings(practiceId))?.practitioner ?? {}) as { timezone?: string; name?: string };
  const start = zonedToUtc(String(k.start), ianaZone(p.timezone)).getTime();
  const end = start + Number(k.durationMin) * 60_000;
  return { k, start, end, astrologer: p.name || "Your astrologer" };
}

/**
 * A pass into the session's call: creates (or updates) its private room, then
 * a meeting token that expires with the room.
 */
export async function joinCall(practiceId: string, consultationId: string, who: { name: string; owner: boolean }, now = Date.now()) {
  const s = await sessionFor(practiceId, consultationId);
  if (now > s.end + LATE_MIN * 60_000) throw new HttpError(409, "This session has ended.");
  if (!who.owner && now < s.start - EARLY_MIN * 60_000) throw new HttpError(425, `The call opens ${EARLY_MIN} minutes before the session.`, { opensAt: new Date(s.start - EARLY_MIN * 60_000).toISOString() });
  const name = `s-${sha256(`${practiceId}:${consultationId}`).slice(0, 24)}`;
  const exp = Math.floor((s.end + LATE_MIN * 60_000) / 1000);
  const audioOnly = s.k.callMode === "audio";
  const properties = { exp, eject_at_room_exp: true, max_participants: 4, start_video_off: audioOnly, enable_chat: false, enable_screenshare: true };
  // Update the room if it exists (the session may have moved), else create it.
  const room = await daily<{ name: string; url: string }>("POST", `/rooms/${name}`, { properties }).catch(async (e: HttpError) => {
    if (e.status !== 404) throw e;
    return daily<{ name: string; url: string }>("POST", "/rooms", { name, privacy: "private", properties });
  });
  const { token } = await daily<{ token: string }>("POST", "/meeting-tokens", {
    properties: { room_name: room.name, user_name: who.name.slice(0, 60), is_owner: who.owner, exp, start_video_off: audioOnly },
  });
  return {
    url: room.url,
    token,
    audioOnly,
    title: String(s.k.type),
    start: new Date(s.start).toISOString(),
    durationMin: Number(s.k.durationMin),
    astrologer: s.astrologer,
  };
}
