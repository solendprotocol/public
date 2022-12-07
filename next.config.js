/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  images: {
    domains: [
      "assets.coingecko.com",
      "raw.githubusercontent.com",
      "via.placeholder.com",
    ],
  },
};
