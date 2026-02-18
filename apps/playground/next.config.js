/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@the-governor-hq/wearable-sdk'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
