import "server-only";
import { eq } from "drizzle-orm";
import { getSettings, listCollection } from "./records";
import { db, schema } from "./db";

type Rec = Record<string, unknown>;

/** Access lasts through the whole expiry day. */
export function isExpired(expiresAt: unknown, now = new Date()) {
  if (typeof expiresAt !== "string" || !expiresAt) return false;
  const today = now.toISOString().slice(0, 10);
  return expiresAt.slice(0, 10) < today;
}

/**
 * Everything a client may see in their portal — and nothing else.
 * Never includes: observations, tasks, draft or archived client work, charts' working data, recordings,
 * practitioner notes (prep/session notes, person notes, client summary),
 * private files, drafts or failed deliveries, or any other client's records.
 */
export async function portalView(practiceId: string, clientId: string) {
  const ids = [clientId];
  const [people, clients, readings, consultations, files, portalNotifications, clientWork, workResponses, settings, charts, intakeRequests] = await Promise.all([
    listCollection(practiceId, "people", { clientIds: ids }),
    listCollection(practiceId, "clients", { clientIds: ids }),
    listCollection(practiceId, "readings", { clientIds: ids }),
    listCollection(practiceId, "consultations", { clientIds: ids }),
    listCollection(practiceId, "files", { clientIds: ids }),
    listCollection(practiceId, "portalNotifications", { clientIds: ids }),
    listCollection(practiceId, "clientWork", { clientIds: ids }),
    listCollection(practiceId, "workResponses", { clientIds: ids }),
    getSettings(practiceId),
    listCollection(practiceId, "charts", { clientIds: ids }),
    listCollection(practiceId, "intakeRequests", { clientIds: ids }),
  ]);
  const [booking] = await db().select({ slug: schema.bookingProfiles.slug, enabled: schema.bookingProfiles.enabled }).from(schema.bookingProfiles).where(eq(schema.bookingProfiles.practiceId, practiceId));
  const me = people.find((p) => p.id === clientId);
  const client = clients.find((c) => c.id === clientId);
  const p = (settings?.practitioner ?? {}) as Rec;
  return {
    practitioner: { name: p.name, firstName: p.firstName, title: p.title, email: p.email, phone: p.phone, practice: p.practice, website: p.website, bio: p.bio, timezone: p.timezone, portalAccent: p.portalAccent, plan: "", bookingUrl: booking?.enabled ? `/book/${booking.slug}` : undefined },
    people: me ? [{ id: me.id, firstName: me.firstName, lastName: me.lastName, birth: me.birth }] : [],
    clients: client ? [{ id: client.id, email: client.email, status: client.status, createdAt: client.createdAt, tags: [], portalAccess: client.portalAccess }] : [],
    readings: readings.filter((r) => r.clientId === clientId && r.status === "delivered" && !isExpired(r.expiresAt)),
    consultations: consultations
      .filter((k) => k.clientId === clientId)
      .map((k) => ({
        id: k.id, clientId: k.clientId, type: k.type, start: k.start, durationMin: k.durationMin, status: k.status, location: k.location, meetingUrl: k.status === "scheduled" ? k.meetingUrl : undefined,
        sharedSummary: k.sharedSummary, readingIds: k.readingIds, recordingIds: [], chartIds: [],
      })),
    files: files.filter((f) => f.clientId === clientId && !f.private).map(({ note, ...f }) => (void note, f)),
    portalNotifications: portalNotifications.filter((n) => n.clientId === clientId),
    // Only work that has been shared: never drafts or archived items.
    clientWork: clientWork.filter((w) => w.clientId === clientId && (w.status === "shared" || w.status === "completed")),
    workResponses: workResponses.filter((r) => r.clientId === clientId),
    // Intake forms sent to them, with their own answers (never the astrologer's review state).
    intakeRequests: intakeRequests.filter((r) => r.clientId === clientId).map(({ applied, ...r }) => (void applied, r)),
    // Only charts the astrologer chose to share, as their read-only snapshot.
    charts: charts.filter((c) => c.clientId === clientId && c.shared).map((c) => ({ id: c.id, title: c.title, type: c.type, clientId: c.clientId, personIds: [], createdAt: c.createdAt, updatedAt: c.updatedAt, shared: c.shared })),
  };
}

type View = Awaited<ReturnType<typeof portalView>>;
const SEP = "~";
const sc = (practiceId: string, id: unknown) => (typeof id === "string" && id ? `${practiceId}${SEP}${id}` : id);
const scHref = (practiceId: string, href: unknown) =>
  typeof href === "string" ? href.replace(/^\/portal\/(readings|work|charts|forms)\/([^/?#]+)/, (_m, kind: string, id: string) => `/portal/${kind}/${practiceId}${SEP}${id}`) : href;

/**
 * A client's portal across every astrologer they see: each practice's view,
 * with ids scoped by practice and the client shown as "me". Each record keeps
 * a `practiceId` so the portal can show (and filter by) who shared it.
 */
export function mergePortalViews(views: { practiceId: string; view: View }[]) {
  const all = <K extends keyof View>(k: K, map: (r: Rec, practiceId: string) => Rec) =>
    views.flatMap(({ practiceId, view }) => (view[k] as Rec[]).map((r) => ({ ...map(r, practiceId), practiceId })));
  const first = views[0]?.view;
  const me = first?.people[0] as Rec | undefined;
  const client = first?.clients[0] as Rec | undefined;
  return {
    practitioner: first?.practitioner ?? {},
    practices: views.map(({ practiceId, view }) => ({ id: practiceId, ...view.practitioner })),
    people: me ? [{ ...me, id: "me" }] : [],
    clients: client ? [{ ...client, id: "me" }] : [],
    readings: all("readings", (r, p) => ({ ...r, id: sc(p, r.id), clientId: "me", consultationId: sc(p, r.consultationId), recordingId: sc(p, r.recordingId) })),
    consultations: all("consultations", (k, p) => ({ ...k, id: sc(p, k.id), clientId: "me", readingIds: ((k.readingIds as string[]) ?? []).map((x) => sc(p, x)) })),
    files: all("files", (f, p) => ({ ...f, id: sc(p, f.id), clientId: "me" })),
    portalNotifications: all("portalNotifications", (n, p) => ({ ...n, id: sc(p, n.id), clientId: "me", href: scHref(p, n.href) })),
    clientWork: all("clientWork", (w, p) => ({ ...w, id: sc(p, w.id), clientId: "me", consultationId: sc(p, w.consultationId) })),
    workResponses: all("workResponses", (r, p) => ({ ...r, id: sc(p, r.id), clientId: "me", workId: sc(p, r.workId) })),
    charts: all("charts", (c, p) => ({ ...c, id: sc(p, c.id), clientId: "me" })),
    intakeRequests: all("intakeRequests", (r, p) => ({ ...r, id: sc(p, r.id), clientId: "me", consultationId: sc(p, r.consultationId) })),
  };
}
