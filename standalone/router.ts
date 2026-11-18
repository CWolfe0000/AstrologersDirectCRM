/**
 * Tiny in-memory router used by the standalone (single-file) build.
 * The artifact host only allows simple `#name` hashes, so the current route
 * lives in memory; `#portal` style hashes are read once as a starting point.
 */
import * as React from "react";

type Loc = { pathname: string; search: string; hash: string };

function parse(href: string, base: Loc): Loc {
  const u = new URL(href, "http://x" + base.pathname + base.search);
  return { pathname: u.pathname.replace(/\/+$/, "") || "/", search: u.search, hash: u.hash };
}

let current: Loc = { pathname: "/app", search: "", hash: "" };
const stack: Loc[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function initRouter(start: string) {
  current = parse(start, current);
}

export const router = {
  push(href: string) {
    const next = parse(href, current);
    stack.push(current);
    current = next;
    emit();
  },
  replace(href: string) {
    current = parse(href, current);
    emit();
  },
  back() {
    const prev = stack.pop();
    if (prev) {
      current = prev;
      emit();
    }
  },
  forward() {},
  refresh() {},
  prefetch() {},
};

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getLocation() {
  return current;
}
export function useLocation() {
  return React.useSyncExternalStore(subscribe, getLocation, getLocation);
}

export const ParamsContext = React.createContext<Record<string, string>>({});
