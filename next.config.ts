import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mgntreuewvwphdadcqvf.supabase.co',
      },
    ],
  },
};

export default nextConfig;
