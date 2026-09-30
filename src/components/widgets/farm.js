"use client";

import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable } from './shared';
import Gauge from '../charts/Gauge';
import ExternalLink from '../shared/ExternalLink';
import SampleDataBadge from '../shared/SampleDataBadge';
import ListenButton from '../shared/ListenButton';
import { fmtTime, fmtTemp, fmtWeekday } from '../../lib/format';
import { sprayWindow, frostRisk, soilWord } from '../../lib/mausam/indices/farm';
import { tonight } from '../../lib/mausam/rules/farm';
import { isHailCode } from '../../lib/mausam/wmo';
import { addDays } from '../../lib/mausam/time';
import { zoneForState, sowingSeason, containerPlants } from '../../data/plantingGuide';
import { GOV_SERVICES } from '../../data/govServices';

const SOIL_BANDS = (t) => [
  { upTo: 0.15, label: t('soilWords.dry'), className: 'ms-gauge--dry' },
  { upTo: 0.3, label: t('soilWords.moist'), className: 'ms-gauge--moist' },
  { upTo: 1, label: t('soilWords.wet'), className: 'ms-gauge--wet' },
];

// ── Soil moisture ──
export function SoilWidget({ view }) {
  const { t } = useTranslation();
  const h = view.ctx.hourAt(view.ctx.nowMs);
  const soil = h?.soil;
  if (!soil || !Number.isFinite(soil.m0_1)) return <WidgetShell id="soil"><NotAvailable /></WidgetShell>;
  const layers = [
    ['m0_1', 'widgets.soil.top'],
    ['m3_9', 'widgets.soil.mid'],
    ['m9_27', 'widgets.soil.root'],
  ].filter(([k]) => Number.isFinite(soil[k]));
  return (
    <WidgetShell id="soil" icon="fa-solid fa-mound" source={t('sources.open-meteo')}>
      {layers.map(([k, label]) => (
        <Gauge key={k} value={soil[k]} max={0.5} bands={SOIL_BANDS(t)} label={t(label)} valueText={soil[k].toFixed(2)} />
      ))}
      {soilWord(soil.m0_1) === 'dry' ? <p>{t('widgets.soil.irrigateHint')}</p> : null}
      {Number.isFinite(soil.t0) ? <p className="ms-muted">{t('widgets.soil.temp', { t: fmtTemp(soil.t0) })}</p> : null}
    </WidgetShell>
  );
}

// ── Spraying window today and tomorrow ──
export function SprayWindowWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const days = [env.today, addDays(env.today, 1)];
  return (
    <WidgetShell id="sprayWindow" icon="fa-solid fa-spray-can">
      <ul className="ms-list">
        {days.map((d, i) => {
          const w = sprayWindow(view.ctx.hourly, d);
          return (
            <li key={d}>
              <strong>{t(i === 0 ? 'common.today' : 'common.tomorrow')}:</strong>{' '}
              {w ? t('widgets.sprayWindow.window', { start: fmtTime(w.start, lang), end: fmtTime(w.end, lang) }) : t('widgets.sprayWindow.none')}
            </li>
          );
        })}
      </ul>
      <p className="ms-muted">{t('widgets.sprayWindow.note')}</p>
    </WidgetShell>
  );
}

// ── Frost and hail, next 3 nights ──
export function FrostHailWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const n = tonight(view.ctx);
  const risk = frostRisk(n) || 'low';
  const nights = [1, 2].map((o) => view.ctx.day(o)).filter(Boolean);
  const hail = view.ctx.window(view.ctx.nowMs, 72).find((h) => isHailCode(h.wmo)) || view.ctx.daily.slice(0, 3).find((d) => isHailCode(d.wmo));
  return (
    <WidgetShell id="frostHail" icon="fa-solid fa-snowflake">
      <p className={`ms-risk--${risk}`}>
        <strong>{t('widgets.frostHail.tonight')}:</strong> {t(`risk.${risk}`)} ({t('widgets.frostHail.min', { t: fmtTemp(n.tminC) })})
      </p>
      <ul className="ms-list">
        {nights.map((d) => (
          <li key={d.date}>
            {fmtWeekday(d.date, lang)}: {t(`risk.${frostRisk({ tminC: d.minC }) || 'low'}`)} ({fmtTemp(d.minC)})
          </li>
        ))}
      </ul>
      <p>
        <strong>{t('widgets.frostHail.hail')}:</strong>{' '}
        {hail ? t('widgets.frostHail.hailPossible', { when: hail.time ? fmtTime(hail.time, lang) : fmtWeekday(hail.date, lang) }) : t('risk.low')}
      </p>
      {env.today ? <p className="ms-muted">{t('widgets.frostHail.groundNote')}</p> : null}
    </WidgetShell>
  );
}

const meghdoot = GOV_SERVICES.find((s) => s.id === 'meghdoot');

// ── Farm advisory: verbatim IMD/ICAR agromet text, or an honest "not here yet" ──
export function AgrometWidget({ env }) {
  const { t } = useTranslation();
  const adv = env.snapshot.agromet;
  return (
    <WidgetShell
      id="agromet"
      icon="fa-solid fa-tractor"
      badge={adv && env.snapshot.isDemo ? <SampleDataBadge variant="demo" /> : null}
      source={<ExternalLink href={meghdoot.url}>{t('widgets.agromet.openMeghdoot')}</ExternalLink>}
    >
      {adv ? (
        <>
          <p lang="en">&ldquo;{adv.text}&rdquo;</p>
          <p className="ms-muted">{adv.issuer}</p>
          <ListenButton text={adv.text} lang="en" />
        </>
      ) : (
        <NotAvailable messageKey="widgets.agromet.notAvailable" />
      )}
    </WidgetShell>
  );
}

// ── What to sow now (static, reviewed dataset; general guide) ──
export function PlantingGuideWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  const gardener = env.personal?.personaSettings?.farm?.role === 'gardener';
  const month = view.ctx.local.month;
  const zone = zoneForState(env.snapshot.place?.state);
  const season = sowingSeason(month);
  const list = gardener ? containerPlants(month) : zone?.crops[season] || [];
  return (
    <WidgetShell id="plantingGuide" icon="fa-solid fa-seedling" source={t('widgets.plantingGuide.note')}>
      {!gardener && !zone ? (
        <NotAvailable messageKey="widgets.plantingGuide.noZone" />
      ) : (
        <>
          <p className="ms-muted">
            {gardener ? t('widgets.plantingGuide.containers') : `${zone.name[lang]} · ${t(`seasons.${season}`)}`}
          </p>
          <ul className="ms-tags">
            {list.map((c) => (
              <li key={c.en}>{c[lang]}</li>
            ))}
          </ul>
        </>
      )}
    </WidgetShell>
  );
}
