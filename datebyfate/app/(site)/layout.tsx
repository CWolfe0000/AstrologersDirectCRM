import { SiteFooter } from "@/components/site-chrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
