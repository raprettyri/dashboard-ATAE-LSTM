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
        hostname: 'pub-84311989504841c683e65d530fd7a8d1.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig;
