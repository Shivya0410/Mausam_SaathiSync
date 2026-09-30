"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It renders its
 * own <html> and <body> and cannot rely on i18n or global CSS, so the text
 * is bilingual inline.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f5f0fd", color: "#1b1530" }}>
        <main style={{ maxWidth: "34rem", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.6rem", marginBottom: "12px", color: "#493971" }}>
            Mausam Saathi could not start
          </h1>
          <p lang="hi" style={{ marginBottom: "10px" }}>मौसम साथी शुरू नहीं हो सका।</p>
          <p style={{ lineHeight: 1.6 }}>
            For official weather warnings, visit{" "}
            <a href="https://mausam.imd.gov.in" style={{ color: "#493971" }}>mausam.imd.gov.in</a>.
          </p>
          {error?.digest && <p style={{ fontSize: "0.8rem" }}>Ref: {error.digest}</p>}
          <button
            onClick={reset}
            style={{
              minHeight: "44px", padding: "0 28px", borderRadius: "999px", border: "none",
              background: "#493971", color: "#fff", fontSize: "1rem", cursor: "pointer",
            }}
          >
            Reload / फिर से लोड करें
          </button>
        </main>
      </body>
    </html>
  );
}
