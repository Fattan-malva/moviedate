import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  env: {
    URL_SCRAPPING: process.env.URL_SCRAPPING || "https://moviebox.ph/",
  },
};

export default nextConfig;
