/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {},
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://chatbot-backend-production-5c39.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
