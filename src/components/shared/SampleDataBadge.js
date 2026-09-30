"use client";

import { useTranslation } from 'react-i18next';
import './SampleDataBadge.css';

const VARIANTS = {
  demo: { label: 'common.demoData', title: 'common.demoDataTitle', icon: 'fa-solid fa-flask' },
  estimate: { label: 'common.estimate', title: 'common.estimateTitle', icon: 'fa-solid fa-wave-square' },
  stale: { label: null, title: 'common.staleTitle', icon: 'fa-solid fa-clock-rotate-left' },
  machineTranslated: { label: 'common.machineTranslated', title: 'common.machineTranslated', icon: 'fa-solid fa-language' },
};

/**
 * Honest-data badge (PRD 0.1 rule 3): anything not live and measured says
 * so. Variants: demo ("Demo data"), estimate, stale ("Updated 2 h ago"),
 * machineTranslated.
 */
export default function SampleDataBadge({ variant = 'demo', label }) {
  const { t } = useTranslation();
  const v = VARIANTS[variant] || VARIANTS.demo;
  return (
    <span className={`sample-data-badge sample-data-badge--${variant}`} title={t(v.title)}>
      <i className={v.icon} aria-hidden="true"></i> {label || (v.label ? t(v.label) : '')}
    </span>
  );
}
