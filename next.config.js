/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "openseauserdata.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "docs.google.com",
      },
      {
        protocol: "https",
        hostname: "media.firefly.land",
      },
      {
        protocol: "https",
        hostname: "*.empirebuilder.world",
      },
      {
        protocol: "https",
        hostname: "i.seadn.io",
      },
    ],
  },
};

export default nextConfig;
