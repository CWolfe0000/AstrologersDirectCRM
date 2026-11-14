import * as React from "react";
import { router, useLocation, ParamsContext } from "../router";

export function useRouter() {
  return router;
}
export function usePathname() {
  return useLocation().pathname;
}
export function useSearchParams() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}
export function useParams<T = Record<string, string>>() {
  return React.useContext(ParamsContext) as T;
}
export function notFound(): never {
  throw new Error("Not found");
}
export function redirect(href: string): never {
  router.replace(href);
  throw new Error("redirect");
}
