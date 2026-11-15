import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AstrologersDirect",
    short_name: "AstrologersDirect",
    description: "Practice management and professional chart software for astrologers.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#F7F5F1",
    theme_color: "#29272B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Today", url: "/app" },
      { name: "Clients", url: "/app/clients" },
      { name: "Calendar", url: "/app/consultations" },
    ],
  };
}
