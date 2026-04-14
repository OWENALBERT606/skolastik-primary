import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NextAuth v4 uses cookies()/headers() synchronously — Next.js 15 requires
  // these to be treated as external so the async restriction is not applied.
  serverExternalPackages: ["next-auth", "@auth/prisma-adapter"],

  // Skip type checking and linting during build (handled in CI separately)
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },

  // Compress responses with gzip/brotli
  compress: true,

  // Don't advertise Next.js version
  poweredByHeader: false,

  images: {
    // Limit image formats to modern formats for smaller payloads
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-soma-lite-app.r2.dev",
      },
    ],
  },

  // Reduce JS bundle — remove console.* in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default nextConfig;
