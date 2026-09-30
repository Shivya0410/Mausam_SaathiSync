"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useNow } from '../../lib/hooks/useNow';
import { ribbonWarnings } from '../../lib/mausam/warnings';
import { levelName } from '../../lib/mausam/hazards';
import { fmtTime } from '../../lib/format';
import { LevelShape } from '../shared/LevelBadge';

const SEEN_KEY = 'mausam.ribbonAnnounced';

/**
 * Orange or Red official warning for the current place, on every page
 * (PRD 7.3, 20.9). Cannot be dismissed, only collapsed. role="alert" the
 * first time a warning appears in a session, role="status" afterwards, so a
 * screen reader announces it once.
 */
export default function AlertRibbon() {
  const { t, i18n } = useTranslation();
  const { snapshot } = useWeather();
  const now = useNow();
  const [collapsed, setCollapsed] = useState(false);
  const [announce, setAnnounce] = useState(false);
  const list = snapshot && now ? ribbonWarnings(snapshot, now) : [];
  const top = list[0];

  useEffect(() => {
    if (!top) return;
    let seen = [];
    try {
      seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]');
    } catch {
      seen = [];
    }
    const key = `${top.id}@${top.level}`;
    if (!seen.includes(key)) {
      // Decided after mount: sessionStorage does not exist on the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnnounce(true);
      try {
        sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, key].slice(-50)));
      } catch {
        // Private mode: announce every time rather than never.
      }
    }
  }, [top]);

  if (!top) return null;
  const lvl = levelName(top.level);
  const hazard = t(`hazards.${top.hazard}`, { defaultValue: top.title });
  return (
    <div className={`ms-ribbon ms-level--${lvl} ${collapsed ? 'is-collapsed' : ''}`} role={announce ? 'alert' : 'status'}>
      <LevelShape level={lvl} size={18} />
      <p className="ms-ribbon-text">
        <strong>{t(`levels.${lvl}`)}</strong> · {hazard}
        {!collapsed ? (
          <>
            {' '}· {t(`levels.action.${lvl}`)}
            {top.validTo ? ` · ${t('alerts.validTill', { time: fmtTime(top.validTo, i18n.language) })}` : ''}
            {list.length > 1 ? ` · ${t('alerts.moreCount', { count: list.length - 1 })}` : ''}
            {top.demo ? ` · ${t('common.demoData')}` : ''}
          </>
        ) : null}
      </p>
      <Link href="/alerts" className="ms-ribbon-link">
        {t('alerts.details')}
      </Link>
      <button type="button" className="ms-ribbon-toggle" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>
        <i className={`fa-solid ${collapsed ? 'fa-angle-down' : 'fa-angle-up'}`} aria-hidden="true"></i>
        <span className="visually-hidden">{t(collapsed ? 'cards.expand' : 'cards.collapse')}</span>
      </button>
    </div>
  );
}
