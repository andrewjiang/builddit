import path from "path";
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "**.warpcast.com",
      },
      {
        protocol: "https",
        hostname: "**.execute-api.**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.colorino.site",
      },
      {
        protocol: "https",
        hostname: "**.pinata.cloud",
      },
      {
        protocol: "https",
        hostname: "**.mypinata.cloud",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
    ],
  },
};
export default nextConfig;
