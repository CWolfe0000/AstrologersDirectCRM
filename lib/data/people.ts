import type { Client, Person, Practitioner } from "./types";

export const practitioner: Practitioner = {
  name: "Celeste Morrow",
  firstName: "Celeste",
  title: "Consulting Astrologer",
  email: "celeste@morrowastrology.com",
  phone: "(503) 555-0148",
  practice: "Morrow Astrological Consulting",
  website: "morrowastrology.com",
  timezone: "America/Los_Angeles (Pacific Time)",
  bio: "Consulting astrologer for fifteen years, focused on natal work, relationship astrology and timing for career transitions. Trained in traditional and modern techniques; works with clients in North America and Europe by video.",
  plan: "Professional (prototype)",
};

const b = (date: string, time: string, place: string, lat: number, lon: number, tz: string, timeAccuracy: "exact" | "approximate" | "unknown" = "exact") => ({ date, time, place, lat, lon, tz, timeAccuracy });

export const clientPeople: Person[] = [
  { id: "c1", firstName: "Amelia", lastName: "Hart", birth: b("1988-03-14", "07:42", "Portland, Oregon, USA", 45.52, -122.68, "America/Los_Angeles") },
  { id: "c2", firstName: "Jonah", lastName: "Whitaker", birth: b("1979-11-02", "22:15", "Chicago, Illinois, USA", 41.88, -87.63, "America/Chicago") },
  { id: "c3", firstName: "Priya", lastName: "Natarajan", birth: b("1992-06-21", "05:30", "Toronto, Ontario, Canada", 43.65, -79.38, "America/Toronto") },
  { id: "c4", firstName: "Marcus", lastName: "Delacroix", birth: b("1985-01-09", "13:05", "New Orleans, Louisiana, USA", 29.95, -90.07, "America/Chicago", "approximate") },
  { id: "c5", firstName: "Sofia", lastName: "Lindqvist", birth: b("1995-09-30", "18:20", "Stockholm, Sweden", 59.33, 18.07, "Europe/Stockholm") },
  { id: "c6", firstName: "Theo", lastName: "Abernathy", birth: b("1970-04-17", "03:10", "Edinburgh, Scotland, UK", 55.95, -3.19, "Europe/London") },
  { id: "c7", firstName: "Hannah", lastName: "Okafor", birth: b("1990-12-05", "11:48", "London, England, UK", 51.51, -0.13, "Europe/London") },
  { id: "c8", firstName: "Rafael", lastName: "Moreno", birth: b("1983-07-27", "16:00", "Madrid, Spain", 40.42, -3.7, "Europe/Madrid") },
  { id: "c9", firstName: "Grace", lastName: "Liu", birth: b("2001-02-18", "09:12", "San Francisco, California, USA", 37.77, -122.42, "America/Los_Angeles") },
  { id: "c10", firstName: "William", lastName: "Prescott", birth: b("1962-08-08", "06:55", "Boston, Massachusetts, USA", 42.36, -71.06, "America/New_York") },
  { id: "c11", firstName: "Naomi", lastName: "Feldman", birth: b("1975-05-23", "20:40", "New York, New York, USA", 40.71, -74.01, "America/New_York") },
  { id: "c12", firstName: "Elliot", lastName: "Brandt", birth: b("1998-10-11", "14:25", "Denver, Colorado, USA", 39.74, -104.99, "America/Denver", "unknown") },
];

export const associatedPeople: Person[] = [
  { id: "p1", clientId: "c1", relationship: "Partner", firstName: "Daniel", lastName: "Reyes", birth: b("1986-08-29", "14:10", "San Diego, California, USA", 32.72, -117.16, "America/Los_Angeles"), notes: "Together since 2021. Discussing marriage and a possible relocation." },
  { id: "p2", clientId: "c1", relationship: "Mother", firstName: "Rose", lastName: "Hart", birth: b("1961-01-22", "09:00", "Eugene, Oregon, USA", 44.05, -123.09, "America/Los_Angeles", "approximate"), notes: "Birth time from family memory — treat as approximate." },
  { id: "p3", clientId: "c2", relationship: "Daughter", firstName: "Clara", lastName: "Whitaker", birth: b("2012-04-03", "03:47", "Chicago, Illinois, USA", 41.88, -87.63, "America/Chicago") },
  { id: "p4", clientId: "c3", relationship: "Spouse", firstName: "Arjun", lastName: "Mehta", birth: b("1990-02-11", "23:05", "Mumbai, India", 19.08, 72.88, "Asia/Kolkata") },
  { id: "p5", clientId: "c8", relationship: "Business Partner", firstName: "Lucía", lastName: "Ferrer", birth: b("1981-03-02", "10:30", "Barcelona, Spain", 41.39, 2.17, "Europe/Madrid") },
];

export const clients: Client[] = [
  { id: "c1", email: "amelia.hart@example.com", phone: "(503) 555-0191", pronouns: "she/her", status: "active", source: "Referral — Naomi Feldman", createdAt: "2023-02-10", tags: ["Relationship", "Relocation"], portalAccess: "active", summary: "Long-term client since 2023. Annual natal + transit reviews; currently exploring a relationship decision and a possible move to Lisbon in 2027." },
  { id: "c2", email: "jonah.w@example.com", phone: "(312) 555-0144", pronouns: "he/him", status: "active", source: "Website", createdAt: "2024-05-03", tags: ["Career", "Parenting"], portalAccess: "active", summary: "Architect weighing a leap to independent practice. Interested in progressions and timing." },
  { id: "c3", email: "priya.n@example.com", phone: "(416) 555-0102", pronouns: "she/her", status: "active", source: "Podcast listener", createdAt: "2025-01-18", tags: ["Career", "Relationship"], portalAccess: "active", summary: "Product designer; works with synastry with her spouse Arjun and career timing." },
  { id: "c4", email: "marcus.delacroix@example.com", phone: "(504) 555-0187", status: "new", source: "Instagram", createdAt: "2026-11-06", tags: ["First reading"], portalAccess: "invited", summary: "New client. Birth time is approximate (\"around lunch\"); rectification may be needed." },
  { id: "c5", email: "sofia.lindqvist@example.com", pronouns: "she/her", status: "active", source: "Referral — Hannah Okafor", createdAt: "2024-09-22", tags: ["Creative work", "Solar return"], portalAccess: "active" },
  { id: "c6", email: "theo.abernathy@example.com", phone: "+44 131 555 0175", pronouns: "he/him", status: "inactive", source: "Conference", createdAt: "2022-06-14", tags: ["Retirement"], portalAccess: "active" },
  { id: "c7", email: "hannah.okafor@example.com", phone: "+44 20 5550 0133", pronouns: "she/her", status: "active", source: "Website", createdAt: "2023-10-01", tags: ["Career", "Health"], portalAccess: "active" },
  { id: "c8", email: "rafael.moreno@example.com", phone: "+34 91 555 0166", pronouns: "he/him", status: "active", source: "Referral", createdAt: "2025-04-12", tags: ["Business", "Partnership"], portalAccess: "active" },
  { id: "c9", email: "grace.liu@example.com", pronouns: "she/they", status: "new", source: "Gift certificate", createdAt: "2026-10-28", tags: ["First reading"], portalAccess: "active" },
  { id: "c10", email: "w.prescott@example.com", phone: "(617) 555-0120", status: "archived", source: "Legacy import", createdAt: "2019-03-03", tags: [], portalAccess: "none" },
  { id: "c11", email: "naomi.feldman@example.com", phone: "(212) 555-0159", pronouns: "she/her", status: "active", source: "Website", createdAt: "2021-08-19", tags: ["Annual review"], portalAccess: "active" },
  { id: "c12", email: "elliot.brandt@example.com", pronouns: "he/him", status: "active", source: "Workshop", createdAt: "2026-03-30", tags: ["Unknown birth time"], portalAccess: "active", summary: "Birth time unknown — working with solar/noon charts and whole-sign houses until a time is found." },
];
