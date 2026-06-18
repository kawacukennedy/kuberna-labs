/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  transpilePackages: ['@kuberna/sdk'],
  trailingSlash: true,
};

// Demo mode: when NEXT_PUBLIC_DEMO_MODE=true, enables local intent parsing and mock blockchain
if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
  nextConfig.env = {
    ...nextConfig.env,
    NEXT_PUBLIC_DEMO_MODE: 'true',
  };
}

module.exports = nextConfig;
