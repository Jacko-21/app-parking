/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bingoz/domain"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
