import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { COLLECTIONS, getSettings, listCollection, listWithVersions, serverNow } from "@/lib/server/records";
import { portalView } from "@/lib/server/portal";
import { DEFAULT_SETTINGS } from "@/lib/astro/meta";

/**
 * Initial data load after sign-in.
 *   ?view=app     practitioner workspace — the whole practice (owners only)
 *   ?view=portal  client portal — the signed-in client's portal view; an
 *                 owner may preview any of their clients with &as=<clientId>
 */
export const GET = handler(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const view = url.searchParams.get("view") ?? "app";
  const me = { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, twoFactor: user.twoFactor };

  if (view === "portal") {
    let clientId = user.clientId;
    if (user.role === "owner") {
      const as = url.searchParams.get("as");
      const clients = await listCollection(user.practiceId, "clients");
      const pick = (as && clients.find((c) => c.id === as)) || clients.find((c) => c.status !== "archived") || null;
      if (!pick) throw new HttpError(404, "Add a client first, then preview their portal.");
      clientId = pick.id as string;
    }
    if (!clientId) throw new HttpError(403, "This account isn't linked to a client record.");
    return json({ view: "portal", user: me, portalClientId: clientId, preview: user.role === "owner", ...(await portalView(user.practiceId, clientId)) });
  }

  if (user.role !== "owner") throw new HttpError(403, "This area is for practitioners.", { redirect: "/portal" });
  const cursor = await serverNow();
  const lists = await Promise.all(COLLECTIONS.map(async (c) => [c, await listWithVersions(user.practiceId, c)] as const));
  const entries = lists.map(([c, rows]) => [c, rows.map((r) => r.record)] as const);
  const versions = Object.fromEntries(lists.map(([c, rows]) => [c, Object.fromEntries(rows.map((r) => [r.record.id as string, r.version]))]));
  const settings = await getSettings(user.practiceId);
  const [practice] = await db().select().from(schema.practices).where(eq(schema.practices.id, user.practiceId));
  return json({
    view: "app",
    user: me,
    practice: { id: practice?.id, name: practice?.name },
    plan: practice?.plan === "premium" ? "premium" : "standard",
    practitioner: settings?.practitioner,
    defaults: settings?.defaults ?? DEFAULT_SETTINGS,
    ...Object.fromEntries(entries),
    versions,
    cursor: cursor.toISOString(),
  });
});
