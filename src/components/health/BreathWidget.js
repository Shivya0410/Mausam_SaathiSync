"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './BreathWidget.css';

const PHASES = [
  { id: 'inhale', labelKey: 'health.breath.in', secs: 4 },
  { id: 'hold', labelKey: 'health.breath.hold', secs: 7 },
  { id: 'exhale', labelKey: 'health.breath.out', secs: 8 },
];

/**
 * 4-7-8 breathing for smoky or hot days (PRD 8.1), kept from the SaathiSync
 * wellness hub. The phase and count are announced in text, not only by the
 * growing circle.
 */
export default function BreathWidget() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [left, setLeft] = useState(PHASES[0].secs);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => {
      if (left > 1) {
        setLeft((s) => s - 1);
        return;
      }
      setPhaseIdx((i) => {
        const next = (i + 1) % PHASES.length;
        if (next === 0) setCycles((c) => c + 1);
        setLeft(PHASES[next].secs);
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [running, left]);

  const phase = PHASES[phaseIdx];
  const reset = () => {
    setRunning(false);
    setPhaseIdx(0);
    setLeft(PHASES[0].secs);
    setCycles(0);
  };

  return (
    <div className="breath-widget">
      <div className={`breath-circle breath-${phase.id} ${running ? 'breath-live' : ''}`} style={{ '--phase-secs': `${phase.secs}s` }} aria-hidden="true">
        <span>{running ? left : '4·7·8'}</span>
      </div>
      <div className="breath-info">
        <strong aria-live="polite">{running ? `${t(phase.labelKey)} · ${left}` : t('health.breath.title')}</strong>
        <p>{running ? t('health.breath.cycles', { count: cycles }) : t('health.breath.pattern')}</p>
        <div className="breath-actions">
          <button type="button" onClick={() => setRunning((r) => !r)} className="ms-btn">
            {running ? t('health.breath.pause') : t('health.breath.begin')}
          </button>
          <button type="button" onClick={reset} className="ms-btn ms-btn--secondary">
            {t('health.breath.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
