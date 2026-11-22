"use client";

import * as React from "react";
import { ShareCards } from "@/components/share/share-cards";

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ShareCards />
    </React.Suspense>
  );
}
