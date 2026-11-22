import "server-only";
import type { Metadata } from "next";
import { publicBooking } from "@/lib/server/booking";
import { SITE_URL } from "@/lib/site";

/** The short address of a profile (astrologersdirect.com/<address>), or the booking path when there's no website host. */
export const profileUrl = (slug: string) => (SITE_URL ? `${SITE_URL}/${slug}` : `/book/${slug}`);

/**
 * Metadata for a public profile, at either address. Shared links preview with
 * the name and headline; search engines list it only if the astrologer chose
 * that, always under the short address.
 */
export async function profileMetadata(slug: string): Promise<Metadata | null> {
  try {
    const { profile } = await publicBooking(slug);
    const title = { absolute: `${profile.displayName} · Book a Session` };
    const description = profile.headline || `Book a session with ${profile.displayName}.`;
    const url = profileUrl(profile.slug);
    return {
      title,
      description,
      robots: { index: !!profile.searchable, follow: !!profile.searchable },
      ...(SITE_URL ? { alternates: { canonical: url } } : {}),
      openGraph: { title: title.absolute, description, type: "profile", ...(SITE_URL ? { url } : {}) },
    };
  } catch {
    return null;
  }
}
