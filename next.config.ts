import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-544161ac01a34681bc8008830d4d5756.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig;
