import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: process.env.E2E_BUILD === 'true',
    remotePatterns: [
      ...(process.env.E2E_BUILD === 'true'
        ? [
            {
              protocol: 'http' as const,
              hostname: '127.0.0.1',
              port: '59001',
              pathname: '/image.svg',
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
