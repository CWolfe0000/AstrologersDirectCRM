/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/prototype", destination: "/how-it-works", permanent: true }];
  },
  eslint: { ignoreDuringBuilds: true },
  // Allows several dev servers side by side (e.g. NEXT_DIST_DIR=.next-b npx next dev -p 3201)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Swiss Ephemeris is a native module: load it at runtime, not through the bundler.
  serverExternalPackages: ["sweph"],
  // Ship the ephemeris data files with the server functions that calculate charts.
  outputFileTracingIncludes: { "/api/v1/astro/**": ["./.sweph-ephe/*.se1"], "/api/v1/timeline": ["./.sweph-ephe/*.se1"] },
};
export default nextConfig;
