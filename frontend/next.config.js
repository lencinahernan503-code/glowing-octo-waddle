/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "*.up.railway.app" },
      { protocol: "https", hostname: "*.railway.app" },
    ],
  },
};

module.exports = nextConfig;
