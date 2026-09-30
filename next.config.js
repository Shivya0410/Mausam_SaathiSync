const path = require('path');

const mediapipePoseShim = path.resolve(__dirname, 'src/shims/mediapipe-pose.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Required so styled-components class names match between the server
    // render and the client hydration. Without it the diet page flashes
    // unstyled on first paint.
    styledComponents: true,
  },
  turbopack: {
    resolveAlias: {
      // See src/shims/mediapipe-pose.js. The real package has no ES exports,
      // which Turbopack rejects, and this app only uses MoveNet.
      // Turbopack resolves these relative to the project root, not absolute.
      '@mediapipe/pose': './src/shims/mediapipe-pose.js',
    },
  },
  webpack: (config) => {
    // Same alias for the webpack build, used by `next build --webpack`.
    config.resolve.alias['@mediapipe/pose'] = mediapipePoseShim;
    return config;
  },

  // Section 6 of the architecture brief names seven canonical sections. These
  // establish that URL space now without a cutover: the existing routes stay
  // authoritative and keep working, so the app's internal links need no
  // coordinated change. When the sections are rebuilt properly, each pair
  // flips direction one line at a time.
  //
  // Temporary (307) rather than permanent, because a 308 is cached hard by
  // browsers and would be painful to reverse once that flip happens.
  async redirects() {
    return [
      { source: '/fitness', destination: '/start', permanent: false },
      { source: '/diet', destination: '/cards', permanent: false },
      { source: '/health', destination: '/arthub', permanent: false },
      { source: '/health/mental-wellness', destination: '/arthub', permanent: false },
      { source: '/women', destination: '/she', permanent: false },
      { source: '/women/tracker', destination: '/she', permanent: false },
      { source: '/sustain', destination: '/sus', permanent: false },
    ];
  },
};

module.exports = nextConfig;
