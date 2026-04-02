import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is NOT needed for Vercel deployment.
  // Vercel handles the build output automatically.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
