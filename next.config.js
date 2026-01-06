/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    // Exclude 'canvas' from webpack bundling - it's only used for CLI image generation
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });
    return config;
  },
};

module.exports = nextConfig;
