"use client";

import { useEffect } from 'react';

/**
 * Route-level error boundary. Without this, a thrown render error shows the
 * bare Next.js default page.
 *
 * `error.message` is deliberately not rendered: in production it may carry
 * internal detail, and it is not useful to the person reading it. The digest
 * is shown so a report can be correlated with a server log.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <main style={{ maxWidth: '34rem', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '12px', color: 'var(--swasth-violet-deep, #493971)' }}>
        Something went wrong
      </h1>
      <p style={{ color: 'var(--swasth-muted, #5c5470)', lineHeight: 1.6, marginBottom: '10px' }}>
        This page failed to load. Trying again often works.
      </p>
      {error?.digest && (
        <p style={{ color: 'var(--swasth-muted, #5c5470)', fontSize: '0.8rem', marginBottom: '28px' }}>
          Reference: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '12px 28px',
          borderRadius: '999px',
          border: 'none',
          background: 'var(--swasth-violet, #6a1b9a)',
          color: '#fff',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </main>
  );
}
