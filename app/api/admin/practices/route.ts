import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin";

/** Every practice on the platform, for the admin page. Counts only: no client data. */
export const GET = handler(async () => {
  await requireAdmin();
  const rows = await db().execute(sql`
    select p.id, p.name, p.plan, p.created_at,
      o.email as owner_email, o.name as owner_name, o.email_verified_at is not null as verified, o.totp_enabled_at is not null as two_factor,
      (select count(*) from clients c where c.practice_id = p.id)::int as clients,
      (select count(*) from client_access a where a.practice_id = p.id)::int as portal_clients,
      (select count(*) from readings r where r.practice_id = p.id and r.data->>'status' = 'delivered')::int as delivered,
      (select max(s.created_at) from sessions s join users u on u.id = s.user_id where u.practice_id = p.id and u.role = 'owner') as last_sign_in
    from practices p
    left join lateral (select * from users u where u.practice_id = p.id and u.role = 'owner' order by u.created_at limit 1) o on true
    order by p.created_at desc
  `);
  const events = await db().select().from(schema.adminEvents).orderBy(desc(schema.adminEvents.at)).limit(30);
  const practices = (rows.rows as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    plan: r.plan === "premium" ? "premium" : "standard",
    createdAt: new Date(r.created_at as string).toISOString(),
    ownerEmail: (r.owner_email as string) ?? null,
    ownerName: (r.owner_name as string) ?? null,
    verified: !!r.verified,
    twoFactor: !!r.two_factor,
    clients: r.clients as number,
    portalClients: r.portal_clients as number,
    delivered: r.delivered as number,
    lastSignIn: r.last_sign_in ? new Date(r.last_sign_in as string).toISOString() : null,
  }));
  return json({ practices, events });
});
