import Link from 'next/link';

export const metadata = { title: 'Page not found | Swasth Infinity' };

export default function NotFound() {
  return (
    <main style={{ maxWidth: '34rem', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '12px', color: 'var(--swasth-violet-deep, #493971)' }}>
        We could not find that page
      </h1>
      <p style={{ color: 'var(--swasth-muted, #5c5470)', lineHeight: 1.6, marginBottom: '28px' }}>
        The link may be out of date, or the section may not be built yet.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '12px 28px',
          borderRadius: '999px',
          background: 'var(--swasth-violet, #6a1b9a)',
          color: '#fff',
          textDecoration: 'none',
        }}
      >
        Back to home
      </Link>
    </main>
  );
}
