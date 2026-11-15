"use client";

import { api } from "@/lib/api";
import type { AstrologyEngine, ChartPoints } from "./types";

type Resp = { engine: AstrologyEngine["info"]; points: ChartPoints };

/** Server mode: chart calculations come from Swiss Ephemeris on the server. */
export const SwissApiEngine: AstrologyEngine = {
  info: {
    id: "swiss",
    name: "Swiss Ephemeris",
    verified: false,
    description: "Swiss Ephemeris 2.10.03 with Astrodienst data files — not yet checked against your reference charts.",
  },
  async natal(birth, settings) {
    return (await api<Resp>("/api/v1/astro/natal", { body: { birth, settings } })).points;
  },
  async positionsAt(iso, settings, reference) {
    // Dates without a zone are taken as UTC (noon for a bare date).
    const utc = /(Z|[+-]\d\d:\d\d)$/.test(iso) ? iso : iso.length === 10 ? `${iso}T12:00:00Z` : iso.length === 16 ? `${iso}:00Z` : `${iso}Z`;
    return (await api<Resp>("/api/v1/astro/positions", { body: { utc, settings, reference: reference && { cusps: reference.cusps, asc: reference.asc, mc: reference.mc } } })).points;
  },
  async progressed(birth, target, settings) {
    return (await api<Resp>("/api/v1/astro/progressed", { body: { birth, target, settings } })).points;
  },
  async solarArc(birth, target, settings) {
    return (await api<Resp>("/api/v1/astro/solar-arc", { body: { birth, target, settings } })).points;
  },
  async solarReturn(birth, year, settings) {
    return (await api<Resp>("/api/v1/astro/solar-return", { body: { birth, year, settings } })).points;
  },
};
