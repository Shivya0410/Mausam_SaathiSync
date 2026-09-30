"use client";

/**
 * Tide curve for the next day (PRD 20.8). Marks highs and lows with their
 * times; a vertical line shows now. Callers render "not available" instead
 * when there is no sea-level data (tides are never guessed).
 * points: [{ time, seaLevelM }]; extrema: [{ time, type, heightM, label }]
 */
export default function TideCurve({ points, extrema = [], nowMs, ariaLabel }) {
  const pts = points.filter((p) => Number.isFinite(p.seaLevelM));
  if (pts.length < 3) return null;
  const W = 600;
  const H = 140;
  const pad = 14;
  const t0 = Date.parse(pts[0].time);
  const t1 = Date.parse(pts[pts.length - 1].time);
  const lo = Math.min(...pts.map((p) => p.seaLevelM));
  const hi = Math.max(...pts.map((p) => p.seaLevelM));
  const x = (ms) => pad + ((W - 2 * pad) * (ms - t0)) / Math.max(1, t1 - t0);
  const y = (v) => pad + 18 + ((H - 2 * pad - 30) * (hi - v)) / Math.max(0.01, hi - lo);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(Date.parse(p.time)).toFixed(1)},${y(p.seaLevelM).toFixed(1)}`).join(' ');
  return (
    <svg className="ms-tide" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <path d={d} className="ms-tide-line" />
      {nowMs && nowMs >= t0 && nowMs <= t1 ? <line className="ms-tide-now" x1={x(nowMs)} x2={x(nowMs)} y1={pad} y2={H - pad} /> : null}
      {extrema.map((e) => {
        const ex = x(Date.parse(e.time));
        const ey = y(e.heightM);
        return (
          <g key={e.time}>
            <circle cx={ex} cy={ey} r="5" className={`ms-tide-dot ms-tide-dot--${e.type}`} />
            <text x={ex} y={e.type === 'high' ? ey - 10 : ey + 20} textAnchor="middle" className="ms-chart-axis">
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
