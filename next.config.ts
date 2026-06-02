import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb"
    }
  },
  images: {
    remotePatterns: [
      {
        hostname: "**.supabase.co",
        protocol: "https"
      }
    ]
  }
};

export default nextConfig;
