"use client";

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { speak } from '../../lib/speech';
import { mmss } from '../../lib/mausam/plans';

/**
 * Lightning takeover (PRD 8.9, 18.14): full screen, a 30-minute "stay
 * inside" timer, spoken instructions, closed only by "I'm safe inside".
 * The timer is information, not a time limit (WCAG 2.2.1), and nothing
 * flashes (WCAG 2.3.1).
 */
export default function LightningTakeover({ since, onSafe }) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const button = useRef(null);
  const until = (since || now) + 30 * 60 * 1000;
  useEffect(() => {
    button.current?.focus();
    const id = setInterval(() => setNow(Date.now()), 1000);
    const onKey = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        button.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearInterval(id);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  const text = t('work.takeover.speech');
  return (
    <div className="ms-takeover" role="alertdialog" aria-modal="true" aria-labelledby="lt-title" aria-describedby="lt-body">
      <div className="ms-takeover-inner">
        <i className="fa-solid fa-bolt ms-takeover-icon" aria-hidden="true"></i>
        <h2 id="lt-title">{t('work.takeover.title')}</h2>
        <p id="lt-body">{t('work.takeover.body')}</p>
        <p className="ms-takeover-timer" aria-live="off">
          {t('work.takeover.stay')} <strong>{mmss(until - now)}</strong>
        </p>
        <p>{t('work.takeover.wait')}</p>
        <p className="ms-actions">
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => speak(text, { lang: i18n.language })}>
            <i className="fa-solid fa-volume-high" aria-hidden="true"></i> {t('work.takeover.hear')}
          </button>
          <button ref={button} type="button" className="ms-btn" onClick={onSafe}>
            {t('work.takeover.safe')}
          </button>
        </p>
      </div>
    </div>
  );
}
