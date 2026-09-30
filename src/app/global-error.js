"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself. It must
 * render its own <html> and <body>, because the layout that normally provides
 * them is what failed.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <main style={{ maxWidth: '34rem', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '12px', color: '#493971' }}>
            Swasth Infinity could not start
          </h1>
          <p style={{ color: '#5c5470', lineHeight: 1.6, marginBottom: '10px' }}>
            Something failed before the page could render.
          </p>
          {error?.digest && (
            <p style={{ color: '#5c5470', fontSize: '0.8rem', marginBottom: '28px' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '12px 28px', borderRadius: '999px', border: 'none',
              background: '#6a1b9a', color: '#fff', fontSize: '1rem', cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
