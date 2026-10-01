const isDev = process.env.NODE_ENV === 'development';

// The optional legacy login talks to this backend from the browser.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sih24-backend.onrender.com').origin;
  } catch {
    return '';
  }
})();

// Security headers (PRD 13.10). No nonces, so pages stay statically
// generated; inline scripts are Next's own bootstrap. 'unsafe-eval' only in
// development (React's dev tooling needs it).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://accounts.google.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  `connect-src 'self' https://accounts.google.com ${apiOrigin}`.trim(),
  'frame-src https://accounts.google.com',
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=(self), payment=(), usb=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  // Inline our small CSS (~13 KB gzipped) into the HTML so slow connections
  // skip the render-blocking stylesheet round trips (PRD 13.8). Returning
  // visitors are served from the service worker cache. Experimental in
  // Next 16; remove if it misbehaves.
  experimental: {
    inlineCss: true,
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // The service worker must always be revalidated so updates reach users.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ];
  },

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
