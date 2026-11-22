/** One id per build, so open tabs can tell when a newer version is live. */
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || `local-${Date.now().toString(36)}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  async redirects() {
    return [{ source: "/prototype", destination: "/how-it-works", permanent: true }];
  },
  eslint: { ignoreDuringBuilds: true },
  // Allows several dev servers side by side (e.g. NEXT_DIST_DIR=.next-b npx next dev -p 3201)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Swiss Ephemeris is a native module: load it at runtime, not through the bundler.
  serverExternalPackages: ["sweph"],
  // Ship the ephemeris data files with the server functions that calculate charts.
  outputFileTracingIncludes: { "/api/v1/astro/**": ["./.sweph-ephe/*.se1", "./.sweph-ephe/sefstars.txt"], "/api/v1/timeline": ["./.sweph-ephe/*.se1"] },
};
export default nextConfig;
