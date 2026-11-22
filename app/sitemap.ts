import type { MetadataRoute } from "next";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** The website's pages, plus each live profile whose astrologer chose to be listed by search engines. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!SITE_URL) return [];
  const pages = ["", "/features", "/how-it-works", "/pricing", "/whats-new", "/about", "/contact", "/request-access"].map((p) => ({ url: `${SITE_URL}${p}` }));
  try {
    const rows = await db()
      .select({ slug: schema.bookingProfiles.slug, updatedAt: schema.bookingProfiles.updatedAt })
      .from(schema.bookingProfiles)
      .where(and(eq(schema.bookingProfiles.enabled, 1), sql`(${schema.bookingProfiles.data}->>'searchable')::boolean is true`));
    return [...pages, ...rows.map((r) => ({ url: `${SITE_URL}/${r.slug}`, lastModified: r.updatedAt }))];
  } catch {
    return pages;
  }
}
