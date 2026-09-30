// Route loading state: a skeleton, not a spinner (PRD section 16.3).
export default function Loading() {
  return (
    <div className="ms-main" aria-busy="true" aria-live="polite">
      <div className="ms-skeleton ms-skeleton--header"></div>
      <div className="ms-skeleton"></div>
      <div className="ms-skeleton"></div>
      <span className="visually-hidden">Loading · लोड हो रहा है</span>
    </div>
  );
}
