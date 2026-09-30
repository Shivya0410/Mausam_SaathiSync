"use client";

import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable } from './shared';
import TideCurve from '../charts/TideCurve';
import ChartFrame from '../charts/ChartFrame';
import ListenButton from '../shared/ListenButton';
import LevelBadge from '../shared/LevelBadge';
import ExternalLink from '../shared/ExternalLink';
import { fmtTime, fmtTemp, fmtHour } from '../../lib/format';
import { seaNow } from '../../lib/mausam/rules/coast';
import { seaStateWord, waterTempWord, fisherVerdict } from '../../lib/mausam/indices/seaSafety';
import { sliceHours, addDays } from '../../lib/mausam/time';
import { levelName } from '../../lib/mausam/hazards';

const VERDICT_ICON = { safe: 'fa-circle-check', caution: 'fa-triangle-exclamation', stay_out: 'fa-ban' };

function marineOf(env) {
  return env.snapshot.marine;
}

// ── Sea state: SAFE / CAUTION / STAY OUT with reasons ──
export function SeaStateWidget({ view, env }) {
  const { t } = useTranslation();
  const marine = marineOf(env);
  const v = seaNow(view.ctx);
  if (!marine || !v) {
    return (
      <WidgetShell id="seaState" icon="fa-solid fa-water">
        <NotAvailable messageKey="widgets.seaState.inland" />
      </WidgetShell>
    );
  }
  const h = sliceHours(marine.hourly, view.ctx.nowMs, 1)[0] || marine.hourly[0];
  return (
    <WidgetShell
      id="seaState"
      icon="fa-solid fa-water"
      more={{ href: '/coast', label: t('widgets.seaState.more') }}
      source={<ExternalLink href="https://incois.gov.in/site/services/hwa.jsp">{t('widgets.seaState.incois')}</ExternalLink>}
    >
      <p className={`ms-verdict ms-verdict--${v.verdict}`}>
        <i className={`fa-solid ${VERDICT_ICON[v.verdict]}`} aria-hidden="true"></i> {t(`verdicts.sea.${v.verdict}`)}
      </p>
      <p>
        {v.reasons.length
          ? v.reasons.map((r) => t(`verdicts.sea.reason.${r}`)).join(', ')
          : t('widgets.seaState.swimNearLifeguards')}
      </p>
      <dl className="ms-kv">
        <div><dt>{t('widgets.seaState.waves')}</dt><dd>{h.waveM ?? '–'} m · {t(`seaWords.${seaStateWord(h.waveM) || 'calm'}`)}</dd></div>
        <div><dt>{t('widgets.seaState.swell')}</dt><dd>{h.swellM ?? '–'} m · {Math.round(h.swellPeriodS ?? 0)} s</dd></div>
      </dl>
    </WidgetShell>
  );
}

/** Tide times for the next day, labelled for the curve. */
export function tidesAhead(marine, nowMs, lang, hours = 30) {
  const tides = (marine?.tides || []).filter((x) => Date.parse(x.time) >= nowMs - 3600e3 && Date.parse(x.time) <= nowMs + hours * 3600e3);
  return tides.map((x) => ({ ...x, label: `${fmtTime(x.time, lang)} · ${x.heightM.toFixed(1)} m` }));
}

// ── Tides (never guessed) ──
export function TidesWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const marine = marineOf(env);
  const tides = tidesAhead(marine, view.ctx.nowMs, lang);
  if (!marine || !tides.length) {
    return (
      <WidgetShell id="tides" icon="fa-solid fa-arrows-up-down">
        <NotAvailable messageKey="widgets.tides.notAvailable" />
      </WidgetShell>
    );
  }
  const points = sliceHours(marine.hourly, view.ctx.nowMs - 3 * 3600e3, 30).map((h) => ({ time: h.time, seaLevelM: h.seaLevelM }));
  const summary = tides.map((x) => `${t(`widgets.tides.${x.type}`)} ${x.label}`).join('; ');
  return (
    <WidgetShell id="tides" icon="fa-solid fa-arrows-up-down" source={t('sources.open-meteo-marine')}>
      <ChartFrame
        summary={summary}
        table={{
          caption: t('widgets.tides.title'),
          columns: [
            { key: 'type', label: t('widgets.tides.tide') },
            { key: 'time', label: t('charts.time') },
            { key: 'h', label: t('widgets.tides.height') },
          ],
          rows: tides.map((x) => ({ key: x.time, type: t(`widgets.tides.${x.type}`), time: fmtTime(x.time, lang), h: `${x.heightM.toFixed(2)} m` })),
        }}
      >
        <TideCurve points={points} extrema={tides} nowMs={view.ctx.nowMs} ariaLabel={summary} />
      </ChartFrame>
    </WidgetShell>
  );
}

// ── Water temperature ──
export function WaterTempWidget({ view, env }) {
  const { t } = useTranslation();
  const h = sliceHours(marineOf(env)?.hourly, view.ctx.nowMs, 1)[0];
  if (!h || !Number.isFinite(h.sstC)) return <WidgetShell id="waterTemp"><NotAvailable /></WidgetShell>;
  return (
    <WidgetShell id="waterTemp" icon="fa-solid fa-temperature-low">
      <p className="ms-stat-big">{fmtTemp(h.sstC, { unit: true })}</p>
      <p>{t(`waterWords.${waterTempWord(h.sstC)}`)}</p>
    </WidgetShell>
  );
}

// ── Fishermen warning: verbatim, go or no-go today and tomorrow ──
export function FisherWarningWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const official = view.ctx.officialWarnings.filter(
    (w) => w.source === 'imd_marine' || ['high_waves', 'cyclone'].includes(w.hazard),
  );
  const marine = marineOf(env);
  const dayVerdict = (offset) => {
    const date = addDays(env.today, offset);
    const land = view.ctx.hoursOn(date);
    const sea = (marine?.hourly || []).filter((h) => h.time.startsWith(date));
    const warned = official.some((w) => (w.validFrom || '').slice(0, 10) <= date && (w.validTo || '9999').slice(0, 10) >= date);
    return fisherVerdict({
      officialWarning: warned,
      maxWindKmh: land.length ? Math.max(...land.map((h) => h.windKmh || 0)) : undefined,
      maxWaveM: sea.length ? Math.max(...sea.map((h) => h.waveM || 0)) : undefined,
    });
  };
  const days = [0, 1].map((o) => ({ o, v: dayVerdict(o) }));
  const text = official[0]?.text;
  return (
    <WidgetShell id="fisherWarning" icon="fa-solid fa-ship">
      {official[0] ? (
        <div className="ms-official-text">
          <LevelBadge level={levelName(official[0].level)} withAction />
          <p lang="en">{text}</p>
          <p className="ms-muted">{official[0].issuer}</p>
          <ListenButton text={text} lang="en" label={t('widgets.fisherWarning.listen')} />
        </div>
      ) : (
        <p className="ms-muted">{t('widgets.fisherWarning.noOfficial')}</p>
      )}
      <ul className="ms-go-list">
        {days.map(({ o, v }) => (
          <li key={o} className={`ms-go ms-go--${v.verdict}`}>
            <i className={`fa-solid ${v.verdict === 'go' ? 'fa-circle-check' : 'fa-ban'}`} aria-hidden="true"></i>
            <strong>{t(o === 0 ? 'common.today' : 'common.tomorrow')}:</strong> {t(`verdicts.fisher.${v.verdict}`)}
            {v.reason && v.reason !== 'official' ? ` (${t(`verdicts.fisher.${v.reason}`)})` : ''}
          </li>
        ))}
      </ul>
      {marine ? (
        <p className="ms-muted">
          {t('widgets.fisherWarning.nextHours', {
            list: sliceHours(marine.hourly, view.ctx.nowMs, 12)
              .filter((_, i) => i % 3 === 0)
              .map((h) => `${fmtHour(h.time, lang)} ${h.waveM ?? '–'} m`)
              .join(', '),
          })}
        </p>
      ) : null}
    </WidgetShell>
  );
}
