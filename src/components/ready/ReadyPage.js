"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import { useNow } from '../../lib/hooks/useNow';
import { useReady } from '../../lib/hooks/useReady';
import { localParts } from '../../lib/mausam/time';
import { fmtDate, fmtWeekday } from '../../lib/format';
import {
  PILLARS, XP, KITS, KIT_FOR_SEASON, BADGES, readySeason, toggleHabit, toggleKitItem, xpTotals, streak, recentDays, kitDone,
} from '../../lib/mausam/ready';

/** Be ready (PRD 9.4, 18.15): four daily preparedness habits, kits and badges. */
export default function ReadyPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const now = useNow();
  const [state, update, fresh] = useReady();
  const today = now ? localParts(now, 330).date : null;

  // Evaluate badges on open too (Sky Snaps and reports are counted elsewhere).
  useEffect(() => {
    if (today) update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const season = today ? readySeason(today) : 'monsoon';
  const done = today ? state.log[today]?.p || [] : [];
  const xp = today ? xpTotals(state.log, today) : { today: 0, week: 0, total: 0 };
  const days = useMemo(() => (today ? recentDays(state.log, today, 28) : []), [state.log, today]);
  const owned = new Map((state.badges || []).map((b) => [b.id, b]));
  const kit = KIT_FOR_SEASON[season];

  return (
    <>
      <PageHeader title={t('pages.ready.title')} subtitle={t('pages.ready.subtitle')} />
      {fresh.length ? (
        <p className="ms-card ms-callout" role="status">
          <i className="fa-solid fa-award" aria-hidden="true"></i> {t('ready.earned', { list: fresh.map((id) => t(`ready.badges.${id}.name`)).join(', ') })}
        </p>
      ) : null}

      <section className="ms-card" aria-labelledby="rd-today">
        <h2 id="rd-today">{t('ready.todayTitle', { season: t(`seasonNames.${season}`) })}</h2>
        <ul className="ms-habits">
          {PILLARS.map((p) => (
            <li key={p}>
              <label className="ms-habit">
                <input type="checkbox" checked={done.includes(p)} onChange={() => today && update((s) => toggleHabit(s, today, p))} disabled={!today} />
                <span className="ms-habit-code" aria-hidden="true">{p}</span>
                <span>
                  <strong>{t(`ready.pillarNames.${p}`)}</strong>
                  <span className="ms-muted">{t(`ready.pillars.${season}.${p}`)}</span>
                  {p === 'A' ? <span className="ms-muted"> {t('ready.autoAware')}</span> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="ms-card" aria-labelledby="rd-progress">
        <h2 id="rd-progress">{t('ready.progress')}</h2>
        <dl className="ms-kv">
          <div><dt>{t('ready.streak')}</dt><dd>{t('ready.days', { count: today ? streak(state.log, today) : 0 })}</dd></div>
          <div><dt>{t('ready.xpToday')}</dt><dd>{xp.today} / {XP.maxPerDay}</dd></div>
          <div><dt>{t('ready.xpWeek')}</dt><dd>{xp.week} / {XP.maxPerWeek}</dd></div>
          <div><dt>{t('ready.xpTotal')}</dt><dd>{xp.total}</dd></div>
        </dl>
        <p className="ms-muted">{t('ready.xpNote')}</p>
        <h3>{t('ready.last4Weeks')}</h3>
        <ol className="ms-ready-grid" aria-label={t('ready.last4Weeks')}>
          {days.map((d) => (
            <li key={d.date} className={`ms-ready-day ms-ready-day--${d.count}`} title={`${fmtDate(d.date, lang)}: ${t('ready.habitsDone', { count: d.count })}`}>
              <span className="visually-hidden">{fmtWeekday(d.date, lang)} {fmtDate(d.date, lang)}: {t('ready.habitsDone', { count: d.count })}</span>
              <span aria-hidden="true">{d.count || ''}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="ms-card" aria-labelledby="rd-kit">
        <h2 id="rd-kit">{t(`ready.kits.${kit}.title`)}</h2>
        <p className="ms-muted">{t('ready.kitHelp')}</p>
        <ul className="ms-habits">
          {KITS[kit].map((item) => (
            <li key={item}>
              <label className="ms-habit">
                <input type="checkbox" checked={(state.kits?.[kit] || []).includes(item)} onChange={() => update((s) => toggleKitItem(s, kit, item))} />
                <span>{t(`ready.kits.${kit}.items.${item}`)}</span>
              </label>
            </li>
          ))}
        </ul>
        {kitDone(state, kit) ? <p role="status"><i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('ready.kitDone')}</p> : null}
        <details className="ms-details">
          <summary>{t('ready.otherKits')}</summary>
          {Object.keys(KITS).filter((k) => k !== kit).map((k) => (
            <div key={k}>
              <h3>{t(`ready.kits.${k}.title`)}</h3>
              <ul className="ms-habits">
                {KITS[k].map((item) => (
                  <li key={item}>
                    <label className="ms-habit">
                      <input type="checkbox" checked={(state.kits?.[k] || []).includes(item)} onChange={() => update((s) => toggleKitItem(s, k, item))} />
                      <span>{t(`ready.kits.${k}.items.${item}`)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      </section>

      <section className="ms-card" aria-labelledby="rd-badges">
        <h2 id="rd-badges">{t('ready.badgesTitle', { earned: owned.size, total: BADGES.length })}</h2>
        <ul className="ms-badges">
          {BADGES.map((b) => {
            const got = owned.get(b.id);
            return (
              <li key={b.id} className={got ? 'is-earned' : 'is-locked'}>
                <i className={`${got ? b.icon : 'fa-solid fa-lock'} ms-badge-icon`} aria-hidden="true"></i>
                <strong>{t(`ready.badges.${b.id}.name`)}</strong>
                <span className="ms-muted">{t(`ready.badges.${b.id}.req`)}</span>
                <span className="ms-muted">{got ? t('ready.earnedOn', { date: fmtDate(got.earnedAt.slice(0, 10), lang) }) : t('ready.locked')}</span>
              </li>
            );
          })}
        </ul>
        <p className="ms-disclaimer">{t('ready.disclaimer')}</p>
        <p><Link href="/learn">{t('ready.toLearn')}</Link></p>
      </section>
    </>
  );
}
