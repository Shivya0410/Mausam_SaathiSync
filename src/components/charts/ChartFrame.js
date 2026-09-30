"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from './DataTable';

/**
 * Wraps a chart with its visible text summary (WCAG 1.1.1) and a
 * Chart | Table toggle (PRD 20.8).
 */
export default function ChartFrame({ summary, table, children }) {
  const { t } = useTranslation();
  const [asTable, setAsTable] = useState(false);
  return (
    <div className="ms-chart">
      {summary ? <p className="ms-chart-summary">{summary}</p> : null}
      {asTable && table ? <DataTable {...table} /> : children}
      {table ? (
        <button type="button" className="ms-link-btn" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
          {asTable ? t('charts.showChart') : t('charts.showTable')}
        </button>
      ) : null}
    </div>
  );
}
