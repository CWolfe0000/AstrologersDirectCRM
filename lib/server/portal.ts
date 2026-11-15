import "server-only";
import { getSettings, listCollection } from "./records";

type Rec = Record<string, unknown>;

/** Access lasts through the whole expiry day. */
export function isExpired(expiresAt: unknown, now = new Date()) {
  if (typeof expiresAt !== "string" || !expiresAt) return false;
  const today = now.toISOString().slice(0, 10);
  return expiresAt.slice(0, 10) < today;
}

/**
 * Everything a client may see in their portal — and nothing else.
 * Never includes: observations, tasks, charts' working data, recordings,
 * practitioner notes (prep/session notes, person notes, client summary),
 * private files, drafts or failed deliveries, or any other client's records.
 */
export async function portalView(practiceId: string, clientId: string) {
  const ids = [clientId];
  const [people, clients, readings, consultations, files, portalNotifications, settings] = await Promise.all([
    listCollection(practiceId, "people", { clientIds: ids }),
    listCollection(practiceId, "clients", { clientIds: ids }),
    listCollection(practiceId, "readings", { clientIds: ids }),
    listCollection(practiceId, "consultations", { clientIds: ids }),
    listCollection(practiceId, "files", { clientIds: ids }),
    listCollection(practiceId, "portalNotifications", { clientIds: ids }),
    getSettings(practiceId),
  ]);
  const me = people.find((p) => p.id === clientId);
  const client = clients.find((c) => c.id === clientId);
  const p = (settings?.practitioner ?? {}) as Rec;
  return {
    practitioner: { name: p.name, firstName: p.firstName, title: p.title, email: p.email, phone: p.phone, practice: p.practice, website: p.website, bio: p.bio, timezone: p.timezone, plan: "" },
    people: me ? [{ id: me.id, firstName: me.firstName, lastName: me.lastName, birth: me.birth }] : [],
    clients: client ? [{ id: client.id, email: client.email, status: client.status, createdAt: client.createdAt, tags: [], portalAccess: client.portalAccess }] : [],
    readings: readings.filter((r) => r.clientId === clientId && r.status === "delivered" && !isExpired(r.expiresAt)),
    consultations: consultations
      .filter((k) => k.clientId === clientId)
      .map((k) => ({
        id: k.id, clientId: k.clientId, type: k.type, start: k.start, durationMin: k.durationMin, status: k.status, location: k.location,
        sharedSummary: k.sharedSummary, readingIds: k.readingIds, recordingIds: [], chartIds: [],
      })),
    files: files.filter((f) => f.clientId === clientId && !f.private).map(({ note, ...f }) => (void note, f)),
    portalNotifications: portalNotifications.filter((n) => n.clientId === clientId),
  };
}
