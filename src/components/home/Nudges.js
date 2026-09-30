"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { stores, nudgeFor, personasFromChoices } from '../../lib/stores';
import { useStore } from '../../lib/hooks/useStore';
import { usePersonas } from '../../lib/context/WeatherProvider';

/**
 * On-device nudges (PRD 3.5): "Tell us about your day" for people who
 * skipped personas (dismissible, back after 7 days), and a one-time "Add
 * Farmer to your homepage?" after repeated visits to a persona page.
 */
export default function Nudges({ now }) {
  const { t } = useTranslation();
  const [usage, setUsage] = useStore(stores.usage);
  const personas = usePersonas();
  if (!now) return null;
  const citizen = personas.ids.length === 1 && personas.ids[0] === 'citizen';
  const promptAt = usage.citizenPromptDismissedAt ? Date.parse(usage.citizenPromptDismissedAt) : 0;
  if (citizen && now - promptAt > 7 * 86400e3) {
    return (
      <aside className="ms-card ms-nudge">
        <p>{t('home.citizenPrompt')}</p>
        <p className="ms-actions">
          <Link href="/onboarding?step=personas" className="ms-btn">{t('home.citizenPromptGo')}</Link>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => setUsage((u) => ({ ...u, citizenPromptDismissedAt: new Date(now).toISOString() }))}>
            {t('common.notNow')}
          </button>
        </p>
      </aside>
    );
  }
  const suggest = nudgeFor(usage, personas.ids, now);
  if (!suggest) return null;
  const done = (accepted) => {
    setUsage((u) => ({ ...u, nudged: { ...u.nudged, [suggest]: true } }));
    if (accepted) {
      const ids = [...personas.ids.filter((x) => x !== 'citizen'), suggest];
      personas.set(personasFromChoices(ids));
    }
  };
  return (
    <aside className="ms-card ms-nudge">
      <p>{t('home.nudge', { persona: t(`personas.${suggest}.name`) })}</p>
      <p className="ms-actions">
        <button type="button" className="ms-btn" onClick={() => done(true)}>{t('common.yes')}</button>
        <button type="button" className="ms-btn ms-btn--secondary" onClick={() => done(false)}>{t('common.notNow')}</button>
      </p>
    </aside>
  );
}
