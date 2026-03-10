import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plaid-merchant-logos.plaid.com",
      },
      {
        protocol: "https",
        hostname: "**.plaid.com",
      },
    ],
  },
};

export default nextConfig;
