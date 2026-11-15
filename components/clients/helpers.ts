import type { Consultation } from "@/lib/data/types";
import { DEMO_TODAY, TODAY } from "@/lib/utils";

const NOW = DEMO_TODAY.getTime();

export function isUpcoming(k: Consultation) {
  return k.status === "scheduled" && new Date(k.start).getTime() >= NOW - 6 * 3600000;
}

export function nextConsultation(all: Consultation[], clientId: string) {
  return all.filter((k) => k.clientId === clientId && isUpcoming(k)).sort((a, b) => a.start.localeCompare(b.start))[0];
}

export function lastConsultation(all: Consultation[], clientId: string) {
  return all
    .filter((k) => k.clientId === clientId && k.status === "completed" && new Date(k.start).getTime() < NOW)
    .sort((a, b) => b.start.localeCompare(a.start))[0];
}

export const TODAY_ISO = TODAY;

export const PLACES = [
  { place: "Portland, Oregon, USA", lat: 45.52, lon: -122.68, tz: "America/Los_Angeles" },
  { place: "Los Angeles, California, USA", lat: 34.05, lon: -118.24, tz: "America/Los_Angeles" },
  { place: "Chicago, Illinois, USA", lat: 41.88, lon: -87.63, tz: "America/Chicago" },
  { place: "New York, New York, USA", lat: 40.71, lon: -74.01, tz: "America/New_York" },
  { place: "New Orleans, Louisiana, USA", lat: 29.95, lon: -90.07, tz: "America/Chicago" },
  { place: "Toronto, Ontario, Canada", lat: 43.65, lon: -79.38, tz: "America/Toronto" },
  { place: "London, England, UK", lat: 51.51, lon: -0.13, tz: "Europe/London" },
  { place: "Edinburgh, Scotland, UK", lat: 55.95, lon: -3.19, tz: "Europe/London" },
  { place: "Paris, France", lat: 48.86, lon: 2.35, tz: "Europe/Paris" },
  { place: "Madrid, Spain", lat: 40.42, lon: -3.7, tz: "Europe/Madrid" },
  { place: "Lisbon, Portugal", lat: 38.72, lon: -9.14, tz: "Europe/Lisbon" },
  { place: "Stockholm, Sweden", lat: 59.33, lon: 18.07, tz: "Europe/Stockholm" },
  { place: "Mumbai, India", lat: 19.08, lon: 72.88, tz: "Asia/Kolkata" },
  { place: "Sydney, NSW, Australia", lat: -33.87, lon: 151.21, tz: "Australia/Sydney" },
  { place: "Mexico City, Mexico", lat: 19.43, lon: -99.13, tz: "America/Mexico_City" },
  { place: "San Francisco, California, USA", lat: 37.77, lon: -122.42, tz: "America/Los_Angeles" },
];

export function fmtCoord(lat: number, lon: number) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
}
