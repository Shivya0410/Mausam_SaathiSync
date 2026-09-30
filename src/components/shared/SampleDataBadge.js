"use client";

import { useTranslation } from 'react-i18next';
import './SampleDataBadge.css';

// Marks a panel whose figures come from src/data/demoStats.js rather than from
// anything the user did. Keeps the app from presenting placeholder health and
// activity numbers as real measurements.
export default function SampleDataBadge({ label }) {
  const { t } = useTranslation();
  return (
    <span className="sample-data-badge" title={t('common.sampleTitle')}>
      {label || t('common.sampleData')}
    </span>
  );
}
