/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Allows several dev servers side by side (e.g. NEXT_DIST_DIR=.next-b npx next dev -p 3201)
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
