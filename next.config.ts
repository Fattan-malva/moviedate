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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push("puppeteer", "@puppeteer/*", "puppeteer-core", "puppeteer-extra", "puppeteer-extra-plugin-*");
      config.resolve.alias = {
        ...config.resolve.alias,
        "puppeteer": false,
        "@puppeteer/browsers": false,
        "puppeteer-core": false,
      };
    }
    return config;
  },
};

export default nextConfig;
