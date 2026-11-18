import type { Metadata } from "next";
import { BookingPage } from "@/components/booking/booking-page";

export const metadata: Metadata = { title: "Book a Session", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <BookingPage slug={(await params).slug} />;
}
