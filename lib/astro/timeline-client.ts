"use client";

import { api } from "@/lib/api";
import { DATA_MODE } from "@/lib/utils";
import { zonedToUtc } from "@/lib/timezones";
import { getEngine } from "./index";
import type { BirthData, ChartSettings, EngineInfo } from "./types";
import { convergenceTimeline, type TimelineOptions, type TimelineResult } from "./timeline";
import { demoEphemeris } from "./demo-ephemeris";

export type TimelineResponse = { engine: EngineInfo; timeline: TimelineResult };

/**
 * Server mode: calculated on the server with Swiss Ephemeris.
 * Demo mode: calculated in the browser with the demonstration ephemeris (approximate, labelled).
 */
export async function fetchTimeline(birth: BirthData, settings: ChartSettings, from: string, to: string, options: Partial<TimelineOptions>): Promise<TimelineResponse> {
  if (DATA_MODE === "server") return api<TimelineResponse>("/api/v1/timeline", { body: { birth, settings, from, to, options } });
  const natal = await getEngine().natal(birth, settings);
  const known = birth.timeAccuracy !== "unknown";
  const birthUtc = zonedToUtc(`${birth.date}T${known ? birth.time : "12:00"}:00`, birth.tz || "UTC").toISOString();
  const timeline = await convergenceTimeline({
    natal: { birthUtc, bodies: natal.bodies.map((b) => ({ id: b.id, lon: b.lon })), ...(known ? { asc: natal.asc, mc: natal.mc, cusps: natal.cusps } : {}) },
    from,
    to,
    eph: demoEphemeris,
    options,
  });
  return { engine: getEngine().info, timeline };
}
