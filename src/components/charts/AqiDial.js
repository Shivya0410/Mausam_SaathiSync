"use client";

import { useTranslation } from 'react-i18next';
import { AQI_BANDS } from '../../lib/mausam/indices/naqi';

const ARC_CLASS = ['good', 'satisfactory', 'moderate', 'poor', 'verypoor', 'severe'];

function polar(cx, cy, r, frac) {
  const a = Math.PI * (1 - frac);
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

/**
 * National AQI dial (PRD 20.7): six CPCB category arcs, a marker at the
 * value, the number and the category word. Never needle-only.
 */
export default function AqiDial({ aqi, category, dominant, size = 180 }) {
  const { t } = useTranslation();
  const cx = 100;
  const cy = 95;
  const r = 80;
  const frac = Math.max(0, Math.min(1, (aqi ?? 0) / 500));
  const [mx, my] = polar(cx, cy, r, frac);
  const label = t('charts.aqiLabel', {
    aqi,
    category: t(`aqi.category.${category}`),
    pollutant: dominant ? t(`pollutants.${dominant}`) : '',
  });
  return (
    <svg className="ms-aqidial" width={size} viewBox="0 0 200 115" role="img" aria-label={label}>
      {AQI_BANDS.map((b, i) => {
        const [x1, y1] = polar(cx, cy, r, (b.lo === 0 ? 0 : b.lo - 1) / 500);
        const [x2, y2] = polar(cx, cy, r, b.hi / 500);
        return <path key={b.category} d={`M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`} className={`ms-arc ms-arc--${ARC_CLASS[i]}`} />;
      })}
      <circle cx={mx} cy={my} r="7" className="ms-dial-marker" />
      <text x={cx} y={cy - 18} textAnchor="middle" className="ms-dial-value">
        {aqi ?? '–'}
      </text>
      <text x={cx} y={cy + 2} textAnchor="middle" className="ms-dial-word">
        {category ? t(`aqi.category.${category}`) : ''}
      </text>
    </svg>
  );
}
