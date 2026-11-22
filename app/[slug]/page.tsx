import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPage } from "@/components/booking/booking-page";
import { profileMetadata } from "@/lib/booking/profile-meta";
import { RESERVED_SLUGS, SLUG_RE } from "@/lib/booking/types";

/**
 * An astrologer's public profile at its short address (astrologersdirect.com/<address>).
 * The website's own pages are static routes and always win; anything that isn't a
 * live profile is a 404.
 */
type Props = { params: Promise<{ slug: string }> };
const valid = (slug: string) => SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug.toLowerCase();
  return (valid(slug) && (await profileMetadata(slug))) || { title: "Page Not Found", robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const slug = (await params).slug.toLowerCase();
  if (!valid(slug) || !(await profileMetadata(slug))) notFound();
  return <BookingPage slug={slug} />;
}
