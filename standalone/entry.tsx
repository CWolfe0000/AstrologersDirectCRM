import * as React from "react";
import { createRoot } from "react-dom/client";
import { initRouter, router, useLocation, ParamsContext } from "./router";
import { StoreHydrator } from "@/lib/store";

import MarketingLayout from "@/app/(marketing)/layout";
import AuthLayout from "@/app/auth/layout";
import AppLayout from "@/app/app/layout";
import PortalLayout from "@/app/portal/layout";

import Home from "@/app/(marketing)/page";
import Features from "@/app/(marketing)/features/page";
import HowItWorks from "@/app/(marketing)/how-it-works/page";
import Pricing from "@/app/(marketing)/pricing/page";
import About from "@/app/(marketing)/about/page";
import Contact from "@/app/(marketing)/contact/page";
import Privacy from "@/app/(marketing)/legal/privacy/page";
import Terms from "@/app/(marketing)/legal/terms/page";

import Login from "@/app/auth/login/page";
import Signup from "@/app/auth/signup/page";
import Reset from "@/app/auth/reset/page";
import Verify from "@/app/auth/verify/page";
import Invite from "@/app/auth/invite/page";

import Dashboard from "@/app/app/page";
import Clients from "@/app/app/clients/page";
import NewClient from "@/app/app/clients/new/page";
import ClientProfile from "@/app/app/clients/[id]/page";
import Charts from "@/app/app/charts/page";
import NewChart from "@/app/app/charts/new/page";
import ChartWorkspace from "@/app/app/charts/[id]/page";
import Timeline from "@/app/app/timeline/page";
import Observations from "@/app/app/observations/page";
import Consultations from "@/app/app/consultations/page";
import Tasks from "@/app/app/tasks/page";
import Delivery from "@/app/app/delivery/page";
import Studio from "@/app/app/studio/page";
import Reports from "@/app/app/reports/page";
import Notifications from "@/app/app/notifications/page";
import Settings from "@/app/app/settings/page";

import PortalHome from "@/app/portal/page";
import PortalReadings from "@/app/portal/readings/page";
import PortalWork from "@/app/portal/work/page";
import PortalWorkDetail from "@/app/portal/work/[id]/page";
import PortalReading from "@/app/portal/readings/[id]/page";
import PortalConsultations from "@/app/portal/consultations/page";
import PortalSettings from "@/app/portal/settings/page";

type Layout = React.ComponentType<{ children: React.ReactNode }>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = React.ComponentType<any>;

const ROUTES: [string, Layout, Page][] = [
  ["/", MarketingLayout, Home],
  ["/features", MarketingLayout, Features],
  ["/how-it-works", MarketingLayout, HowItWorks],
  ["/pricing", MarketingLayout, Pricing],
  ["/about", MarketingLayout, About],
  ["/contact", MarketingLayout, Contact],
  ["/legal/privacy", MarketingLayout, Privacy],
  ["/legal/terms", MarketingLayout, Terms],
  ["/auth/login", AuthLayout, Login],
  ["/auth/signup", AuthLayout, Signup],
  ["/auth/reset", AuthLayout, Reset],
  ["/auth/verify", AuthLayout, Verify],
  ["/auth/invite", AuthLayout, Invite],
  ["/app", AppLayout, Dashboard],
  ["/app/clients", AppLayout, Clients],
  ["/app/clients/new", AppLayout, NewClient],
  ["/app/clients/:id", AppLayout, ClientProfile],
  ["/app/charts", AppLayout, Charts],
  ["/app/charts/new", AppLayout, NewChart],
  ["/app/charts/:id", AppLayout, ChartWorkspace],
  ["/app/timeline", AppLayout, Timeline],
  ["/app/observations", AppLayout, Observations],
  ["/app/consultations", AppLayout, Consultations],
  ["/app/tasks", AppLayout, Tasks],
  ["/app/delivery", AppLayout, Delivery],
  ["/app/studio", AppLayout, Studio],
  ["/app/reports", AppLayout, Reports],
  ["/app/notifications", AppLayout, Notifications],
  ["/app/settings", AppLayout, Settings],
  ["/portal", PortalLayout, PortalHome],
  ["/portal/readings", PortalLayout, PortalReadings],
  ["/portal/work", PortalLayout, PortalWork],
  ["/portal/work/:id", PortalLayout, PortalWorkDetail],
  ["/portal/readings/:id", PortalLayout, PortalReading],
  ["/portal/consultations", PortalLayout, PortalConsultations],
  ["/portal/settings", PortalLayout, PortalSettings],
];

function match(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  for (const [pattern, layout, page] of ROUTES) {
    const pp = pattern.split("/").filter(Boolean);
    if (pp.length !== parts.length) continue;
    const params: Record<string, string> = {};
    if (pp.every((seg, i) => (seg.startsWith(":") ? ((params[seg.slice(1)] = decodeURIComponent(parts[i]!)), true) : seg === parts[i]))) {
      return { layout, page, params };
    }
  }
  return null;
}

function NotFound() {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <p className="font-serif text-3xl">Page not found</p>
      <a href="/app" className="mt-4 inline-block text-accent underline">Back to the workspace</a>
    </div>
  );
}

class Boundary extends React.Component<{ children: React.ReactNode; k: string }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidUpdate(prev: { k: string }) { if (prev.k !== this.props.k && this.state.err) this.setState({ err: null }); }
  render() {
    if (this.state.err) return <div style={{ padding: 48 }}><p className="font-serif text-2xl">Something went wrong on this screen.</p><p className="mt-2 text-muted">{this.state.err.message}</p><a href="/app" className="mt-4 inline-block text-accent underline">Back to the workspace</a></div>;
    return this.props.children;
  }
}

function App() {
  const loc = useLocation();
  const m = match(loc.pathname);

  React.useEffect(() => {
    if (loc.hash) {
      const el = document.getElementById(loc.hash.slice(1));
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }, [loc.pathname, loc.hash]);

  if (!m) return <NotFound />;
  const { layout: L, page: P, params } = m;
  return (
    <ParamsContext.Provider value={params}>
      <Boundary k={loc.pathname}>
        <L>
          <React.Suspense fallback={null}>
            <P key={loc.pathname} />
          </React.Suspense>
        </L>
      </Boundary>
    </ParamsContext.Provider>
  );
}

// Intercept in-app links (both <Link> and plain anchors with absolute paths).
document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as HTMLElement).closest?.("a");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || a.target === "_blank") return;
  if (href.startsWith("/")) {
    e.preventDefault();
    if (a.dataset.replace) router.replace(href); else router.push(href);
  } else if (href.startsWith("#")) {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }
});

// The artifact viewer auto-declines confirm(); the prototype treats confirmations as accepted.
window.confirm = () => true;

const startHash = location.hash.replace(/^#/, "");
const START: Record<string, string> = { home: "/", app: "/app", portal: "/portal", guide: "/app" };
initRouter(START[startHash] ?? "/app");

createRoot(document.getElementById("root")!).render(
  <>
    <StoreHydrator />
    <App />
  </>,
);
