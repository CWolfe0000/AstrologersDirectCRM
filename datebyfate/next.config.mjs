/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Swiss Ephemeris is a native module: load it at runtime, not through the bundler.
  serverExternalPackages: ["sweph", "all-the-cities"],
  // Ship the ephemeris data files with every server function that calculates charts.
  outputFileTracingIncludes: { "/**": ["./.sweph-ephe/*.se1"], "/api/places": ["./node_modules/all-the-cities/cities.pbf"] },
};
export default nextConfig;
