"use client";
import * as React from "react";

export function useMedia(query: string) {
  const [m, setM] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}
