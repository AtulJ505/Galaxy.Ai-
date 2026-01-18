/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.transloadit.com', 'files.transloadit.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.transloadit.com',
      },
      {
        protocol: 'https',
        hostname: 'files.transloadit.com',
      },
    ],
  },
};

module.exports = nextConfig;
