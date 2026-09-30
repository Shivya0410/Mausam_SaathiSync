"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useNow } from '../../lib/hooks/useNow';
import { officialStatus } from '../../lib/mausam/warnings';
import { levelName } from '../../lib/mausam/hazards';

/** Bell with the count of active official warnings; badge colour = highest level. */
export default function AlertsBell() {
  const { t } = useTranslation();
  const { snapshot } = useWeather();
  const now = useNow();
  const s = snapshot && now ? officialStatus(snapshot, now) : { state: 'unavailable', count: 0 };
  const lvl = s.highest ? levelName(s.highest.level) : null;
  return (
    <Link href="/alerts" className="ms-icon-btn ms-bell" aria-label={t('topbar.alertsBell', { count: s.count })}>
      <i className="fa-solid fa-bell" aria-hidden="true"></i>
      {s.count ? <span className={`ms-bell-badge ms-level--${lvl}`} aria-hidden="true">{s.count}</span> : null}
    </Link>
  );
}
