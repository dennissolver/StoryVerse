/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mwlxqnytywhemzllruky.supabase.co' },
      { protocol: 'https', hostname: '*.replicate.delivery' },
    ],
  },
};

module.exports = nextConfig;
