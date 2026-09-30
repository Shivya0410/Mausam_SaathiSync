"use client";

/**
 * Labelled vertical bars (5-day rain, UV by hour). Each bar shows its value
 * as text, so the chart reads without colour or scale.
 * bars: [{ key, label, value, text, className }]
 */
export default function BarChart({ bars, max, ariaLabel, height = 110 }) {
  const top = max ?? Math.max(1, ...bars.map((b) => b.value || 0));
  return (
    <div className="ms-barchart" role="img" aria-label={ariaLabel}>
      {bars.map((b) => (
        <div key={b.key} className="ms-bar-col">
          <span className="ms-bar-value">{b.text}</span>
          <span className="ms-bar-track" style={{ height }}>
            <span
              className={`ms-bar-fill ${b.className || ''}`}
              style={{ height: `${Math.max(2, Math.min(100, ((b.value || 0) / top) * 100))}%` }}
            ></span>
          </span>
          <span className="ms-bar-label">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
