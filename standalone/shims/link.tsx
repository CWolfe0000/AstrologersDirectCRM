import * as React from "react";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string; query?: Record<string, string> };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
};

/** Plain anchor; navigation is handled by the global click interceptor in entry.tsx. */
const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch, replace, scroll, shallow, ...rest }, ref) {
  void prefetch; void scroll; void shallow;
  const h = typeof href === "string" ? href : (href.pathname ?? "/") + (href.query ? "?" + new URLSearchParams(href.query).toString() : "");
  return <a ref={ref} href={h} data-replace={replace ? "1" : undefined} {...rest} />;
});
export default Link;
