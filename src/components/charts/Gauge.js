"use client";

/**
 * Horizontal gauge with named bands (soil moisture and similar, PRD 20.7).
 * bands: [{ upTo, label, className }] ascending; the current band's label is
 * shown as text next to the value.
 */
export default function Gauge({ value, min = 0, max = 1, bands = [], label, valueText }) {
  const frac = Number.isFinite(value) ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const band = bands.find((b) => value <= b.upTo) || bands[bands.length - 1];
  return (
    <div className="ms-gauge">
      <div className="ms-gauge-head">
        <span>{label}</span>
        <strong>
          {valueText} {band ? `· ${band.label}` : ''}
        </strong>
      </div>
      <div
        className="ms-gauge-track"
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number.isFinite(value) ? value : undefined}
        aria-valuetext={`${valueText} ${band?.label ?? ''}`}
      >
        <span className={`ms-gauge-fill ${band?.className || ''}`} style={{ width: `${frac * 100}%` }}></span>
      </div>
    </div>
  );
}
