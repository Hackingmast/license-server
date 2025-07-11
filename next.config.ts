import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',              // Required for static export
  assetPrefix: '/',              // Allows fonts and assets to load correctly
  trailingSlash: true,           // Enables folder-based routing like /about/index.html

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
