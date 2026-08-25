import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable JSON imports in server components
  },
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ztxxamhsabptdotozawz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
