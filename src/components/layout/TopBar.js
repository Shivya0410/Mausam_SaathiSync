"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, UPCOMING_LANGUAGES } from '../../config/site';
import { useLanguage } from '../../lib/i18n/useLanguage';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useA11y } from '../../lib/context/A11yProvider';
import { useOnline } from '../../lib/hooks/useOnline';
import PlaceSwitcher from '../places/PlaceSwitcher';
import A11yMenu from '../a11y/A11yMenu';
import AlertsBell from './AlertsBell';
import SampleDataBadge from '../shared/SampleDataBadge';
import { fmtTime } from '../../lib/format';

/**
 * Top bar (PRD 5.3, 20.1): brand, place switcher, language, accessibility
 * tools, alerts bell, and offline, lite and demo chips. Two rows on mobile.
 */
export default function TopBar() {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { status, snapshot, demo } = useWeather();
  const { lite } = useA11y();
  const online = useOnline();
  const offline = !online || status === 'offline';

  return (
    <header role="banner" className="ms-topbar">
      <div className="ms-topbar-row">
        <Link href="/" className="ms-brand" aria-label={t('topbar.homeLink')}>
          <span className="ms-brand-mark" aria-hidden="true">
            <i className="fa-solid fa-cloud-sun"></i>
          </span>
          <span className="ms-brand-name">{t('common.appName')}</span>
        </Link>
        <PlaceSwitcher />
        <AlertsBell />
      </div>
      <div className="ms-topbar-row ms-topbar-tools">
        {offline ? (
          <span className="ms-topchip ms-topchip--offline" role="status">
            <i className="fa-solid fa-wifi" aria-hidden="true"></i>{' '}
            {snapshot?.current?.updatedAt ? t('common.offline', { time: fmtTime(snapshot.current.updatedAt, i18n.language) }) : t('topbar.offlineChip')}
          </span>
        ) : null}
        {lite ? <span className="ms-topchip">{t('topbar.liteMode')}</span> : null}
        {demo ? <SampleDataBadge variant="demo" label={t('topbar.demoScenario')} /> : null}
        <label className="ms-lang">
          <span className="visually-hidden">{t('topbar.language')}</span>
          <i className="fa-solid fa-language" aria-hidden="true"></i>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.htmlLang}>
                {l.label}
              </option>
            ))}
            <optgroup label={t('topbar.moreLanguages')}>
              {UPCOMING_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} disabled lang={l.code}>
                  {l.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <A11yMenu />
      </div>
    </header>
  );
}
