/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Old SaathiSync sections whose content moved (PRD section 4.1). Every
  // other removed route falls through to the custom not-found page, which
  // links to Home, Alerts and Forecast.
  //
  // Temporary (307) rather than permanent: a 308 is cached hard by browsers
  // and would be painful to reverse if a section moves again.
  async redirects() {
    return [
      { source: '/wellness', destination: '/health', permanent: false },
      { source: '/tracker', destination: '/ready', permanent: false },
      { source: '/community', destination: '/reports', permanent: false },
      { source: '/start', destination: '/run', permanent: false },
      { source: '/profile', destination: '/settings', permanent: false },
    ];
  },
};

module.exports = nextConfig;
