"use client";

import { useTranslation } from 'react-i18next';

// Each level has its own shape as well as colour and word, so levels are
// distinguishable without colour (PRD 3.7, 16.3): circle green, triangle
// yellow, diamond orange, octagon red.
const SHAPES = {
  green: <circle cx="8" cy="8" r="6.5" />,
  yellow: <polygon points="8,1.5 15,14.5 1,14.5" />,
  orange: <polygon points="8,1 15,8 8,15 1,8" />,
  red: <polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" />,
};

export function LevelShape({ level, size = 14 }) {
  return (
    <svg className="ms-level-shape" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <g fill="currentColor" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8">{SHAPES[level] || SHAPES.green}</g>
    </svg>
  );
}

/** "◆ ORANGE · Be prepared" pill in the IMD colour. */
export default function LevelBadge({ level, withAction = false, className = '' }) {
  const { t } = useTranslation();
  if (!level) return null;
  return (
    <span className={`ms-level ms-level--${level} ${className}`}>
      <LevelShape level={level} />
      <span className="ms-level-word">{t(`levels.${level}`)}</span>
      {withAction ? <span className="ms-level-action"> · {t(`levels.action.${level}`)}</span> : null}
    </span>
  );
}
