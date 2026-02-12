/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'mysql2'],
  },
};

export default nextConfig;