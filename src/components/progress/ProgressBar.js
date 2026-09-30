"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import './ProgressBar.css';

const ITEMS = [
  { code: 'Y', labelKey: 'pillars.yoga', icon: 'fa-solid fa-person-praying' },
  { code: 'M', labelKey: 'pillars.meditation', icon: 'fa-solid fa-brain' },
  { code: 'E', labelKey: 'pillars.diet', icon: 'fa-solid fa-apple-whole' },
  { code: 'C', labelKey: 'pillars.creative', icon: 'fa-solid fa-wand-magic-sparkles' },
];

const TOTAL = 30;

function Ring({ pct, icon, completeLabel }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(100, pct)) / 100 * c;
  return (
    <div className="prog-ring">
      <svg viewBox="0 0 120 120" className="prog-ring-svg" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="prog-ring-track" />
        <circle
          cx="60" cy="60" r={r}
          className="prog-ring-fill"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="prog-ring-center">
        <i className={icon}></i>
        <strong>{pct.toFixed(2)}%</strong>
        <span>{completeLabel}</span>
      </div>
    </div>
  );
}

export default function ProgressBar({ activityCounts = {} }) {
  const { t } = useTranslation();
  const calc = (code) => {
    const n = Object.values(activityCounts).filter((d) => d[code]).length;
    return (n / TOTAL) * 100;
  };

  return (
    <div className="prog-gauges">
      {ITEMS.map((it, i) => {
        const p = calc(it.code);
        return (
          <div key={it.code} className="prog-gauge" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="prog-gauge-label">{t(it.labelKey)}: {p.toFixed(2)}%</div>
            <Ring pct={p} icon={it.icon} completeLabel={t('progress.complete')} />
          </div>
        );
      })}
    </div>
  );
}
