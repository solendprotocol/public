/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // should be set to true. If false, someone forgot to turn it on after development
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.coingecko.com',
      },
    ],
  },
};

module.exports = nextConfig;
