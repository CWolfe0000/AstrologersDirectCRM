import type { Metadata } from "next";
import { ManageBooking } from "@/components/booking/manage-booking";

export const metadata: Metadata = { title: "Your Booking", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <ManageBooking token={(await params).token} />;
}
