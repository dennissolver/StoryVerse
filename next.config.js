/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mwlxqnytywhemzllruky.supabase.co' },
      { protocol: 'https', hostname: '*.replicate.delivery' },
    ],
  },
};
module.exports = nextConfig;
