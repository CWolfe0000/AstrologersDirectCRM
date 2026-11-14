"use client";

import * as React from "react";
import { useStore } from "@/lib/store";

/** True once persisted demo data has been loaded from localStorage. */
export function useHydrated() {
  const [h, setH] = React.useState(false);
  React.useEffect(() => {
    if (useStore.persist.hasHydrated()) setH(true);
    const unsub = useStore.persist.onFinishHydration(() => setH(true));
    const t = setTimeout(() => setH(true), 400);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);
  return h;
}
