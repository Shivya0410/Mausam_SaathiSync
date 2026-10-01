"use client";

import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LevelBadge from '../shared/LevelBadge';
import ListenButton from '../shared/ListenButton';
import SampleDataBadge from '../shared/SampleDataBadge';
import { levelName, hazardGroup, ADVICE_GROUPS } from '../../lib/mausam/hazards';
import { fmtTime, fmtDate, relativeDay, fmtAgo } from '../../lib/format';

const HAZARD_ICON = {
  rain_heavy: 'fa-cloud-showers-heavy', thunder: 'fa-cloud-bolt', hail: 'fa-cloud-meatball', dust: 'fa-wind',
  heat: 'fa-temperature-high', warm_night: 'fa-moon', cold: 'fa-temperature-low', fog: 'fa-smog', frost: 'fa-snowflake',
  wind: 'fa-wind', sea: 'fa-water', cyclone: 'fa-hurricane', flood: 'fa-house-flood-water', snow: 'fa-snowflake',
};

/**
 * One official warning (PRD 7.2): level word, shape and action phrase,
 * hazard, area, validity, issuer, verbatim text, Listen, Share, and "What
 * should I do?" with the official advice for that level.
 */
export default function WarningCard({ w, today, now }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [advice, setAdvice] = useState(false);
  const [gist, setGist] = useState(false);
  const [shared, setShared] = useState(null);
  const lvl = levelName(w.level);
  const group = hazardGroup(w.hazard);
  const hazard = t(`hazards.${w.hazard}`, { defaultValue: w.title });
  const when = (iso) => {
    if (!iso) return '';
    const rel = relativeDay(iso.slice(0, 10), today);
    return rel ? `${t(`common.${rel}`)} ${fmtTime(iso, lang)}` : `${fmtDate(iso, lang)} ${fmtTime(iso, lang)}`;
  };
  const summary = `${t(`levels.${lvl}`)} · ${hazard} · ${w.area || ''}. ${w.text || ''}`;
  const share = async () => {
    const text = `${summary} (${w.issuer})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: hazard, text, url: `${location.origin}/alerts` });
        setShared('shared');
      } else {
        await navigator.clipboard.writeText(`${text} ${location.origin}/alerts`);
        setShared('copied');
      }
    } catch {
      setShared(null);
    }
  };
  const minsLeft = w.validTo && now ? Date.parse(w.validTo) - now : null;
  return (
    <article className={`ms-dcard ms-dcard--official ms-dcard--${lvl}`} aria-labelledby={`${uid}-h`}>
      <div className="ms-dcard-tag">
        <LevelBadge level={lvl} withAction />
        {w.demo ? <SampleDataBadge variant="demo" /> : null}
      </div>
      <h3 id={`${uid}-h`}>
        <i className={`fa-solid ${HAZARD_ICON[group] || 'fa-triangle-exclamation'}`} aria-hidden="true"></i> {hazard}
        {w.area ? <span className="ms-muted"> · {w.area}</span> : null}
      </h3>
      <p className="ms-muted">
        {w.issuer}
        {w.issuedAt ? ` · ${t('alerts.issued', { time: when(w.issuedAt) })}` : ''}
        {w.validTo ? ` · ${t('alerts.validTill', { time: when(w.validTo) })}` : ''}
        {w.source === 'imd_nowcast' && minsLeft > 0 ? ` · ${t('alerts.left', { time: fmtAgo(minsLeft, lang) })}` : ''}
      </p>
      {w.text ? (
        <>
          <p className={open ? '' : 'ms-clamp'} id={`${uid}-text`} lang={w.lang ? w.lang.slice(0, 2).toLowerCase() : /[\u0900-\u097F]/.test(w.text) ? 'hi' : 'en'}>
            {w.text}
          </p>
          {lang === 'hi' && !/[\u0900-\u097F]/.test(w.text) ? <p className="ms-muted">{t('alerts.issuedInEnglish')}</p> : null}
          {lang === 'hi' && w.text && !/[\u0900-\u097F]/.test(w.text) ? (
            <>
              <button type="button" className="ms-chip-btn" aria-expanded={gist} onClick={() => setGist((g) => !g)}>
                <i className="fa-solid fa-language" aria-hidden="true"></i> {t('alerts.hindiGist')}
              </button>
              {gist ? (
                <p className="ms-why">
                  <strong>{hazard} · {t(`levels.action.${lvl}`)}</strong>
                  {w.area ? ` · ${w.area}` : ''}<br />
                  {ADVICE_GROUPS.includes(group) ? t(`officialAdvice.${group}.${lvl}`) : t('alerts.followAuthorities')}<br />
                  <span className="ms-muted">{t('alerts.gistNote')}</span>
                </p>
              ) : null}
            </>
          ) : null}
          {w.text.length > 160 ? (
            <button type="button" className="ms-link-btn" aria-expanded={open} aria-controls={`${uid}-text`} onClick={() => setOpen((o) => !o)}>
              {t(open ? 'alerts.showLess' : 'alerts.readFull')}
            </button>
          ) : null}
        </>
      ) : null}
      {w.instruction ? <p><strong>{t('alerts.instruction')}:</strong> {w.instruction}</p> : null}
      {advice ? (
        <p className="ms-why" id={`${uid}-adv`}>
          <strong>{t(`levels.action.${lvl}`)}:</strong> {ADVICE_GROUPS.includes(group) ? t(`officialAdvice.${group}.${lvl}`) : t('alerts.followAuthorities')}
        </p>
      ) : null}
      <div className="ms-dcard-actions">
        <button type="button" className="ms-chip-btn" aria-expanded={advice} onClick={() => setAdvice((a) => !a)}>
          <i className="fa-solid fa-list-check" aria-hidden="true"></i> {t('alerts.whatToDo')}
        </button>
        <ListenButton text={summary} lang={w.lang?.toLowerCase().startsWith('hi') ? 'hi' : lang} />
        <button type="button" className="ms-chip-btn" onClick={share}>
          <i className="fa-solid fa-share-nodes" aria-hidden="true"></i> {t('alerts.share')}
        </button>
        {shared ? <span role="status" className="ms-muted">{t(`alerts.${shared}`)}</span> : null}
      </div>
    </article>
  );
}
