import { Suspense } from "react";
import type { Metadata } from "next";
import { DeliveryPage } from "@/components/delivery/delivery-page";

export const metadata: Metadata = { title: "Reading Delivery" };

export default function Page() {
  return (
    <Suspense>
      <DeliveryPage />
    </Suspense>
  );
}
