/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Swiss Ephemeris is a native module: load it at runtime, not through the bundler.
  serverExternalPackages: ["sweph"],
  // Ship the ephemeris data files with every server function that calculates charts.
  outputFileTracingIncludes: { "/**": ["./.sweph-ephe/*.se1"] },
};
export default nextConfig;
