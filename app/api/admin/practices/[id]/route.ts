import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson } from "@/lib/server/http";
import { logAdmin, requireAdmin } from "@/lib/server/admin";
import { releasePracticeClients } from "@/lib/server/clientaccess";
import { removePracticeObjects } from "@/lib/server/storage";

type Ctx = { params: Promise<{ id: string }> };

async function load(id: string) {
  const [p] = await db().select().from(schema.practices).where(eq(schema.practices.id, id));
  if (!p) throw new HttpError(404, "Practice not found.");
  const [owner] = await db().select().from(schema.users).where(and(eq(schema.users.practiceId, id), eq(schema.users.role, "owner"))).limit(1);
  return { p, owner };
}

/** Change a practice's plan: { plan: "standard" | "premium" }. */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { p } = await load((await ctx.params).id);
  const { plan } = (await readJson(req)) as { plan?: string };
  if (plan !== "standard" && plan !== "premium") throw new HttpError(422, "Plan must be standard or premium.");
  if (p.plan !== plan) {
    await db().update(schema.practices).set({ plan }).where(eq(schema.practices.id, p.id));
    await logAdmin(admin.email, "plan", p.id, `${p.plan} → ${plan}`);
  }
  return json({ ok: true, plan });
});

/**
 * Permanently delete a practice (e.g. a test account): same as the owner deleting
 * their own account. Requires { confirm: <owner's email> }. Never your own practice.
 */
export const DELETE = handler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { p, owner } = await load((await ctx.params).id);
  if (p.id === admin.practiceId) throw new HttpError(400, "You can’t delete your own practice here. Use Settings → Data instead.");
  const { confirm } = (await readJson(req)) as { confirm?: string };
  const expected = owner?.email ?? p.id;
  if (String(confirm ?? "").trim().toLowerCase() !== expected.toLowerCase()) throw new HttpError(400, "Type the owner’s email address exactly to confirm.");
  await releasePracticeClients(p.id);
  await db().delete(schema.practices).where(eq(schema.practices.id, p.id));
  await logAdmin(admin.email, "delete", p.id, `${p.name} (${expected})`);
  await removePracticeObjects(p.id).catch((e) => console.error(`[admin] stored files for ${p.id} not removed:`, e));
  return json({ ok: true });
});
