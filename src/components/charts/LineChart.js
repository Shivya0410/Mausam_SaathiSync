"use client";

/**
 * Small responsive SVG line chart with optional bars (PRD 20.8).
 * series: [{ id, label, values: number[], className, dashed }]
 * bars:   { label, values: number[], max, className }
 * xLabels: string[] (same length as values), shown every `labelEvery`.
 */
export default function LineChart({ series = [], bars, xLabels = [], labelEvery = 6, height = 160, ariaLabel }) {
  const n = Math.max(xLabels.length, ...series.map((s) => s.values.length), bars?.values.length ?? 0);
  if (!n) return null;
  const W = 600;
  const H = height;
  const pad = { l: 34, r: 8, t: 10, b: 24 };
  const all = series.flatMap((s) => s.values).filter(Number.isFinite);
  const min = Math.floor(Math.min(...all) - 1);
  const max = Math.ceil(Math.max(...all) + 1);
  const x = (i) => pad.l + ((W - pad.l - pad.r) * i) / Math.max(1, n - 1);
  const y = (v) => pad.t + ((H - pad.t - pad.b) * (max - v)) / Math.max(1, max - min);
  const barW = Math.max(2, (W - pad.l - pad.r) / n - 2);
  return (
    <svg className="ms-linechart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      {bars
        ? bars.values.map((v, i) => {
            const h = ((H - pad.t - pad.b) * Math.min(v || 0, bars.max)) / bars.max;
            return <rect key={`b${i}`} className={bars.className || 'ms-chart-bar'} x={x(i) - barW / 2} y={H - pad.b - h} width={barW} height={h} />;
          })
        : null}
      {[min, Math.round((min + max) / 2), max].map((v) => (
        <g key={`g${v}`}>
          <line className="ms-chart-grid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
          <text className="ms-chart-axis" x={pad.l - 6} y={y(v) + 4} textAnchor="end">
            {v}°
          </text>
        </g>
      ))}
      {series.map((s) => {
        const d = s.values
          .map((v, i) => (Number.isFinite(v) ? `${i === 0 || !Number.isFinite(s.values[i - 1]) ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}` : ''))
          .join(' ');
        return <path key={s.id} d={d} className={`ms-chart-line ${s.className || ''}`} strokeDasharray={s.dashed ? '6 4' : undefined} />;
      })}
      {xLabels.map((l, i) =>
        i % labelEvery === 0 ? (
          <text key={`x${i}`} className="ms-chart-axis" x={x(i)} y={H - 6} textAnchor="middle">
            {l}
          </text>
        ) : null,
      )}
    </svg>
  );
}
