import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/dm-sans";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: "Datebyfate — See The Pattern In Who You Love", template: "%s · Datebyfate" },
  description: "Datebyfate reads your birth chart for your relationship pattern, finds what repeats across your past partners, and checks anyone new against it.",
  openGraph: { title: "Datebyfate", description: "See the pattern in who you love.", type: "website" },
};
export const viewport: Viewport = { themeColor: "#231428" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
