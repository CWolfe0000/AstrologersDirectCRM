import type { Metadata, Viewport } from "next";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/inter";
import "./globals.css";
import { StoreHydrator } from "@/lib/store";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { UpdateNotice } from "@/components/app/update-notice";

export const metadata: Metadata = {
  title: { default: "AstrologersDirect — Your Practice. Connected.", template: "%s · AstrologersDirect" },
  description:
    "Practice management and professional chart software for astrologers. Clients, charts, consultations, observations and reading delivery in one connected workspace.",
  applicationName: "AstrologersDirect",
  appleWebApp: { capable: true, title: "AstrologersDirect", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#29272B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreHydrator />
        <ServiceWorkerRegister />
        {children}
        <UpdateNotice />
      </body>
    </html>
  );
}
