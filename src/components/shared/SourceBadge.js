"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtTime, fmtAgo } from '../../lib/format';

/**
 * "Open-Meteo · 10:45 AM" (PRD 2.3 rule 3: every number shows its source and
 * time). Amber when older than `staleMin` minutes. Tap for the full list.
 */
export default function SourceBadge({ sources = [], updatedAt, now, staleMin = 90 }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const lang = i18n.language;
  const first = sources[0];
  if (!first) return null;
  const when = updatedAt || first.updatedAt;
  const age = when && now ? now - Date.parse(when) : null;
  const stale = age != null && age > staleMin * 60000;
  const name = t(`sources.${first.name}`, { defaultValue: first.name });
  return (
    <span className={`ms-source ${stale ? 'ms-source--stale' : ''}`}>
      <button type="button" className="ms-source-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {name}
        {when ? ` · ${stale ? t('common.stale', { ago: fmtAgo(age, lang) }) : fmtTime(when, lang)}` : ''}
      </button>
      {open ? (
        <span className="ms-source-pop" role="note">
          {sources.map((s) => (
            <span key={s.name} className="ms-source-row">
              {t(`sources.${s.name}`, { defaultValue: s.name })}
              {s.updatedAt ? ` · ${fmtTime(s.updatedAt, lang)}` : ''}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}
