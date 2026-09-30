import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/**
 * ESLint flat config.
 *
 * `next lint` was removed in Next.js 16, so ESLint is invoked directly by the
 * `lint` npm script. eslint-config-next already exports a flat config array,
 * so no FlatCompat shim is needed.
 */
export default [
  ...nextCoreWebVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      // Vendored third-party sites. Not ours to lint or fix.
      'public/SheFit/**',
      'public/aframe-environment-component-master/**',
      'public/src/**',
    ],
  },
  {
    rules: {
      // The app uses plain <img> deliberately. Moving to next/image is a
      // separate decision, not something to be warned about on every run.
      '@next/next/no-img-element': 'off',
    },
  },
];
