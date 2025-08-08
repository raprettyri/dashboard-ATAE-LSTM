/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  rewrites: isDevelopment
      ? async () => {
        return [
          {
            source: "/api/:path*",
            destination: "http://127.0.0.1:5328/:path*",
          },
        ];
      }
      : undefined,
};

module.exports = nextConfig;