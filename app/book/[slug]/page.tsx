import type { Metadata } from "next";
import { BookingPage } from "@/components/booking/booking-page";
import { profileMetadata } from "@/lib/booking/profile-meta";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return (await profileMetadata((await params).slug)) ?? { title: "Book a Session", robots: { index: false } };
}

export default async function Page({ params }: Props) {
  return <BookingPage slug={(await params).slug} />;
}
