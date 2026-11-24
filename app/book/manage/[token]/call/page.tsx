import type { Metadata } from "next";
import { BookingCall } from "@/components/call/booking-call";

export const metadata: Metadata = { title: "Your Session", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <BookingCall token={(await params).token} />;
}
