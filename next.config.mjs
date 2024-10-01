/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader',
    });

    return config;
  },
};

export default nextConfig;
