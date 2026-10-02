"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import ListenButton from '../shared/ListenButton';

/** One-sentence dynamic summary banner (PRD 5.4). Announced politely when it changes. */
export default function GreetingLine({ text }) {
  const { t } = useTranslation();
  if (!text) return <div className="ms-greeting-banner ms-skeleton ms-skeleton--line" aria-hidden="true"></div>;

  return (
    <div className="ms-greeting-banner">
      <div className="ms-greeting-content">
        <span className="ms-greeting-spark" aria-hidden="true">
          <i className="fa-solid fa-sparkles"></i>
        </span>
        <p aria-live="polite" className="ms-greeting-text">{text}</p>
      </div>
      <ListenButton text={text} compact label={t('home.listenSummary')} />
    </div>
  );
}
