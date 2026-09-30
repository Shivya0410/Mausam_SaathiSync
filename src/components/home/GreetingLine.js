"use client";

import { useTranslation } from 'react-i18next';
import ListenButton from '../shared/ListenButton';

/** One-sentence summary (PRD 5.4). Announced politely when it changes. */
export default function GreetingLine({ text }) {
  const { t } = useTranslation();
  if (!text) return <p className="ms-greeting ms-skeleton ms-skeleton--line" aria-hidden="true"></p>;
  return (
    <div className="ms-greeting">
      <p aria-live="polite">{text}</p>
      <ListenButton text={text} compact label={t('home.listenSummary')} />
    </div>
  );
}
