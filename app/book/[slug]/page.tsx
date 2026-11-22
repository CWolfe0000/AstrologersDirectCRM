import type { Metadata } from "next";
import { BookingPage } from "@/components/booking/booking-page";
import { publicBooking } from "@/lib/server/booking";

type Props = { params: Promise<{ slug: string }> };

/** Shared links preview with the astrologer's name and headline. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { profile } = await publicBooking((await params).slug);
    const title = `${profile.displayName} · Book a Session`;
    const description = profile.headline || `Book a session with ${profile.displayName}.`;
    return { title, description, robots: { index: false }, openGraph: { title, description, type: "profile" } };
  } catch {
    return { title: "Book a Session", robots: { index: false } };
  }
}

export default async function Page({ params }: Props) {
  return <BookingPage slug={(await params).slug} />;
}
