"use client";

import { useTranslation } from 'react-i18next';
import { fmtTime } from '../../lib/format';

/** Where every number came from, and when (PRD 2.3 rule 3, 5.2 #14). */
export default function DataFootnote({ snapshot }) {
  const { t, i18n } = useTranslation();
  if (!snapshot) return null;
  const names = [...new Set((snapshot.sources || []).map((s) => t(`sources.${s.name}`, { defaultValue: s.name })))];
  return (
    <aside className="ms-footnote" aria-label={t('home.dataSources')}>
      <p>
        {t('home.dataFrom', { list: names.join(' · ') })} · {t('home.checked', { time: fmtTime(snapshot.current?.updatedAt || snapshot.fetchedAt, i18n.language) })}
      </p>
      <p>{t(`home.warningsStatus.${snapshot.warningsStatus || 'unavailable'}`)}</p>
      {snapshot.isDemo ? <p>{t('home.demoNote')}</p> : null}
    </aside>
  );
}
