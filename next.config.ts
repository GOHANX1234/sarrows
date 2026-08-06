import type { NextConfig } from "next";

const replitDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    ...(replitDomain ? [replitDomain] : []),
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  ...(replitDomain && {
    experimental: {
      serverActions: {
        allowedOrigins: [replitDomain],
      },
    },
  }),
};

export default nextConfig;
