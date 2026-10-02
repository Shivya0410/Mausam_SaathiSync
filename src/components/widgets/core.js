"use client";

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable, heatCell, upcoming } from './shared';
import WeatherIcon from '../shared/WeatherIcon';
import BarChart from '../charts/BarChart';
import HourBand from '../charts/HourBand';
import ChartFrame from '../charts/ChartFrame';
import { fmtHour, fmtTime, fmtTemp, fmtVisibility, fmtWeekday, relativeDay, compassWord } from '../../lib/format';
import { compass8 } from '../../lib/mausam/geo';
import { rainfallCategory } from '../../lib/mausam/indices/farm';
import { uvCategory } from '../../lib/mausam/indices/uv';
import { heatIndexC } from '../../lib/mausam/indices/heatIndex';
import { thunderProb } from '../../lib/mausam/rules/general';
import { levelName } from '../../lib/mausam/hazards';
import { LevelShape } from '../shared/LevelBadge';

/** Beaufort word for wind speed (PRD Appendix A.6). */
export function beaufort(kmh) {
  const steps = [[1, 'calm'], [6, 'lightAir'], [12, 'lightBreeze'], [20, 'gentleBreeze'], [29, 'moderateBreeze'], [39, 'freshBreeze'], [50, 'strongBreeze'], [62, 'nearGale'], [75, 'gale']];
  return (steps.find(([lim]) => kmh < lim) || [0, 'strongGale'])[1];
}

// ── Next 24 hours (anchor widget) ──
export function HourlyWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isHi = lang === 'hi';
  const scroller = useRef(null);
  const [metric, setMetric] = useState('temp'); // 'temp' | 'feels' | 'rain'
  const hours = upcoming(view, 24);

  if (!hours.length) return <WidgetShell id="hourly"><NotAvailable /></WidgetShell>;
  const scroll = (dir) => scroller.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  return (
    <WidgetShell id="hourly" icon="fa-solid fa-clock" more={{ href: '/forecast', label: t('widgets.hourly.more') }}>
      <div className="ms-hourly-toolbar">
        <div className="ms-metric-toggle-group" role="radiogroup" aria-label="Forecast metric">
          <button
            type="button"
            className={`ms-metric-toggle-btn ${metric === 'temp' ? 'is-active' : ''}`}
            role="radio"
            aria-checked={metric === 'temp'}
            onClick={() => setMetric('temp')}
          >
            <i className="fa-solid fa-temperature-half" aria-hidden="true"></i>
            <span>{isHi ? 'तापमान' : 'Temperature'}</span>
          </button>
          <button
            type="button"
            className={`ms-metric-toggle-btn ${metric === 'feels' ? 'is-active' : ''}`}
            role="radio"
            aria-checked={metric === 'feels'}
            onClick={() => setMetric('feels')}
          >
            <i className="fa-solid fa-hand-sparkles" aria-hidden="true"></i>
            <span>{isHi ? 'महसूस' : 'Feels Like'}</span>
          </button>
          <button
            type="button"
            className={`ms-metric-toggle-btn ${metric === 'rain' ? 'is-active' : ''}`}
            role="radio"
            aria-checked={metric === 'rain'}
            onClick={() => setMetric('rain')}
          >
            <i className="fa-solid fa-cloud-rain" aria-hidden="true"></i>
            <span>{isHi ? 'बारिश' : 'Rain Chance'}</span>
          </button>
        </div>
      </div>

      <div className="ms-strip-nav">
        <button type="button" className="ms-icon-btn ms-strip-arrow-btn" onClick={() => scroll(-1)} aria-label={t('charts.scrollBack')}>
          <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <ol className="ms-strip" ref={scroller} tabIndex={0} aria-label={t('widgets.hourly.title')}>
          {hours.map((h) => {
            const isHighRain = (h.precipProb ?? 0) >= 50;
            return (
              <li key={h.time} className={`ms-strip-item ${metric === 'rain' && isHighRain ? 'is-rain-likely' : ''}`}>
                <span className="ms-strip-time">{fmtHour(h.time, lang)}</span>
                <div className="ms-strip-icon-wrap">
                  <WeatherIcon code={h.wmo} isDay={h.isDay} size={30} />
                </div>
                
                {metric === 'temp' && (
                  <span className="ms-strip-temp">{fmtTemp(h.tempC)}</span>
                )}
                {metric === 'feels' && (
                  <span className="ms-strip-temp ms-strip-temp--feels">
                    <span className="ms-strip-label-mini">{t('now.feelsLike')}</span>
                    {fmtTemp(h.feelsC)}
                  </span>
                )}
                {metric === 'rain' && (
                  <div className="ms-strip-rain-metric">
                    <div className="ms-strip-rain-bar-wrap">
                      <div className="ms-strip-rain-bar" style={{ height: `${Math.max(8, h.precipProb ?? 0)}%` }}></div>
                    </div>
                    <span className="ms-strip-rain-pct">{h.precipProb ?? 0}%</span>
                  </div>
                )}

                <div className="ms-strip-badges">
                  {metric !== 'rain' && (
                    <span className={`ms-strip-rain-badge ${isHighRain ? 'is-high' : ''}`}>
                      <i className="fa-solid fa-droplet" aria-hidden="true"></i> {h.precipProb ?? 0}%
                    </span>
                  )}
                  <span className="ms-strip-wind">
                    <i className="fa-solid fa-wind" aria-hidden="true"></i> {Math.round(h.windKmh)} {t('units.kmh')}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <button type="button" className="ms-icon-btn ms-strip-arrow-btn" onClick={() => scroll(1)} aria-label={t('charts.scrollForward')}>
          <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </WidgetShell>
  );
}

// ── Next 7 days (anchor widget) ──
export function DailyWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const days = view.ctx.daily.filter((d) => d.date >= env.today).slice(0, 7);
  if (!days.length) return <WidgetShell id="daily"><NotAvailable /></WidgetShell>;

  const warnLevel = (date) =>
    Math.max(
      0,
      ...view.ctx.officialWarnings
        .filter((w) => (w.validFrom || '').slice(0, 10) <= date && (w.validTo || '9999').slice(0, 10) >= date)
        .map((w) => w.level),
    );

  // Find min/max across all 7 days for visual temperature range bar
  const allMax = Math.max(...days.map((d) => d.maxC ?? 30));
  const allMin = Math.min(...days.map((d) => d.minC ?? 20));
  const tempSpan = Math.max(1, allMax - allMin);

  return (
    <WidgetShell id="daily" icon="fa-solid fa-calendar-week" more={{ href: '/forecast', label: t('widgets.daily.more') }}>
      <ul className="ms-daylist">
        {days.map((d) => {
          const rel = relativeDay(d.date, env.today);
          const level = warnLevel(d.date);
          const leftPct = Math.round((((d.minC ?? allMin) - allMin) / tempSpan) * 100);
          const widthPct = Math.max(15, Math.round((((d.maxC ?? allMax) - (d.minC ?? allMin)) / tempSpan) * 100));

          return (
            <li key={d.date} className="ms-day-row">
              <div className="ms-day-lead">
                <span className="ms-day-name">{rel ? t(`common.${rel}`) : fmtWeekday(d.date, lang)}</span>
                <span className="ms-day-date-sub">{d.date.slice(5)}</span>
              </div>

              <div className="ms-day-condition">
                <WeatherIcon code={d.wmo} size={26} />
                <span className="ms-day-cond-text">{t(`wmo.${d.wmo}`)}</span>
              </div>

              <div className="ms-day-rain-prob">
                <div className="ms-rain-pill">
                  <i className="fa-solid fa-droplet" aria-hidden="true"></i>
                  <span>{d.precipProbMax ?? 0}%</span>
                </div>
              </div>

              <div className="ms-day-temps-bar-wrap">
                <span className="ms-day-temp-min">{fmtTemp(d.minC)}</span>
                <div className="ms-day-temp-bar-bg" aria-hidden="true">
                  <div
                    className="ms-day-temp-bar-fill"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  ></div>
                </div>
                <span className="ms-day-temp-max">{fmtTemp(d.maxC)}</span>
              </div>

              <div className="ms-day-warn">
                {level >= 2 ? (
                  <span className={`ms-level ms-level--${levelName(level)} ms-level--dot`} title={t(`levels.${levelName(level)}`)}>
                    <LevelShape level={levelName(level)} />
                    <span className="visually-hidden">{t(`levels.${levelName(level)}`)}</span>
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}

// ── Rain in the next 3 hours ──
export function RainSoonWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const hours = upcoming(view, 4);
  if (!hours.length) return <WidgetShell id="rainSoon"><NotAvailable /></WidgetShell>;
  const first = hours.find((h) => h.precipProb >= 50 && h.precipMm >= 0.2);
  const summary = first
    ? t('widgets.rainSoon.likelyFrom', { time: fmtTime(first.time, lang), prob: first.precipProb })
    : t('widgets.rainSoon.none');
  return (
    <WidgetShell id="rainSoon" icon="fa-solid fa-cloud-rain">
      <p className="ms-widget-lead">{summary}</p>
      <ChartFrame
        table={{
          caption: t('widgets.rainSoon.title'),
          columns: [
            { key: 'time', label: t('charts.time') },
            { key: 'prob', label: t('charts.rainChance') },
            { key: 'mm', label: t('charts.rainMm') },
          ],
          rows: hours.map((h) => ({ key: h.time, time: fmtHour(h.time, lang), prob: `${h.precipProb}%`, mm: h.precipMm })),
        }}
      >
        <BarChart
          ariaLabel={summary}
          max={100}
          height={70}
          bars={hours.map((h) => ({ key: h.time, label: fmtHour(h.time, lang), value: h.precipProb, text: `${h.precipProb}%`, className: 'ms-bar--rain' }))}
        />
      </ChartFrame>
    </WidgetShell>
  );
}

// ── Rain, next 5 days ──
export function Rain5DayWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const days = view.ctx.daily.filter((d) => d.date >= env.today).slice(0, 5);
  if (!days.length) return <WidgetShell id="rain5Day"><NotAvailable /></WidgetShell>;
  const total = Math.round(days.reduce((s, d) => s + (d.precipMm || 0), 0));
  const summary = t('widgets.rain5Day.summary', { mm: total });
  return (
    <WidgetShell id="rain5Day" icon="fa-solid fa-cloud-showers-heavy" source={t('widgets.rain5Day.categoryNote')}>
      <ChartFrame
        summary={summary}
        table={{
          caption: t('widgets.rain5Day.title'),
          columns: [
            { key: 'day', label: t('charts.day') },
            { key: 'mm', label: t('charts.rainMm') },
            { key: 'prob', label: t('charts.rainChance') },
            { key: 'cat', label: t('charts.category') },
          ],
          rows: days.map((d) => ({
            key: d.date,
            day: fmtWeekday(d.date, lang),
            mm: Math.round(d.precipMm * 10) / 10,
            prob: `${d.precipProbMax}%`,
            cat: t(`rainfall.${rainfallCategory(d.precipMm)}`),
          })),
        }}
      >
        <BarChart
          ariaLabel={summary}
          bars={days.map((d) => ({
            key: d.date,
            label: relativeDay(d.date, env.today) ? t(`common.${relativeDay(d.date, env.today)}`) : fmtWeekday(d.date, lang),
            value: d.precipMm,
            text: `${Math.round(d.precipMm)} ${t('units.mm')}`,
            className: d.precipMm >= 64.5 ? 'ms-bar--heavy' : 'ms-bar--rain',
          }))}
          max={Math.max(20, ...days.map((d) => d.precipMm))}
        />
      </ChartFrame>
    </WidgetShell>
  );
}

// ── Wind ──
export function WindWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const h = view.ctx.hourAt(view.ctx.nowMs);
  if (!h) return <WidgetShell id="wind"><NotAvailable /></WidgetShell>;
  const maxGust = Math.max(...upcoming(view, 12).map((x) => x.gustKmh || 0));
  const dir = compass8(h.windDirDeg);
  return (
    <WidgetShell id="wind" icon="fa-solid fa-wind">
      <div className="ms-stat-row">
        <span className="ms-compass" aria-hidden="true">
          <i className="fa-solid fa-location-arrow" style={{ transform: `rotate(${(h.windDirDeg + 180 - 45) % 360}deg)` }}></i>
        </span>
        <div>
          <p className="ms-stat-big">
            {Math.round(h.windKmh)} <span className="ms-unit">{t('units.kmh')}</span>
          </p>
          <p>{t('widgets.wind.from', { dir: compassWord(dir, lang, { long: true }), word: t(`beaufort.${beaufort(h.windKmh)}`) })}</p>
          <p className="ms-muted">{t('widgets.wind.gusts', { gust: Math.round(maxGust) })}</p>
        </div>
      </div>
    </WidgetShell>
  );
}

// ── Fog and visibility (IMD fog categories, PRD 8.7) ──
export function fogCategory(m) {
  if (!Number.isFinite(m)) return null;
  if (m < 50) return 'veryDense';
  if (m < 200) return 'dense';
  if (m < 500) return 'moderate';
  if (m < 1000) return 'shallow';
  return 'clear';
}

export function VisibilityWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const hours = upcoming(view, 12).filter((h) => h.visibilityM != null);
  if (!hours.length) return <WidgetShell id="visibility"><NotAvailable /></WidgetShell>;
  const now = hours[0];
  const worst = hours.reduce((a, b) => (b.visibilityM < a.visibilityM ? b : a));
  const cat = fogCategory(worst.visibilityM);
  return (
    <WidgetShell id="visibility" icon="fa-solid fa-smog" source={t('widgets.visibility.categoryNote')}>
      <p className="ms-stat-big">{fmtVisibility(now.visibilityM, lang)}</p>
      <p>
        {cat === 'clear'
          ? t('widgets.visibility.clear')
          : t('widgets.visibility.worst', { cat: t(`fog.${cat}`), vis: fmtVisibility(worst.visibilityM, lang), time: fmtTime(worst.time, lang) })}
      </p>
    </WidgetShell>
  );
}

// ── Lightning (status and 30-30 guidance, PRD 5.8 #30) ──
export function LightningWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const nowcast = view.ctx.thunderNowcast();
  const next3 = upcoming(view, 3).find((h) => thunderProb(h) >= 40);
  const next12 = upcoming(view, 12).find((h) => thunderProb(h) >= 40);
  const status = nowcast ? 'nearby' : next3 ? 'possible' : 'none';
  return (
    <WidgetShell id="lightning" icon="fa-solid fa-bolt" more={{ href: '/work', label: t('widgets.lightning.safety') }}>
      <p className={`ms-status ms-status--${status}`}>
        <i className={`fa-solid ${status === 'none' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} aria-hidden="true"></i>{' '}
        {t(`widgets.lightning.${status}`, { time: next3 ? fmtTime(next3.time, lang) : '' })}
      </p>
      {status === 'none' && next12 ? <p className="ms-muted">{t('widgets.lightning.later', { time: fmtTime(next12.time, lang) })}</p> : null}
      <p className="ms-muted">{t('widgets.lightning.rule3030')}</p>
    </WidgetShell>
  );
}

// ── Sunrise and sunset (SunCalc, labelled "Calculated") ──
export function SunTimesWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const sun = env.snapshot.sun;
  if (!sun?.sunrise) return <WidgetShell id="sunTimes"><NotAvailable /></WidgetShell>;
  const hours = Math.floor((sun.dayLengthMin ?? 0) / 60);
  const mins = (sun.dayLengthMin ?? 0) % 60;
  return (
    <WidgetShell id="sunTimes" icon="fa-solid fa-sun" source={t('sources.calculated')}>
      <dl className="ms-kv">
        <div><dt>{t('widgets.sunTimes.sunrise')}</dt><dd>{fmtTime(sun.sunrise, lang)}</dd></div>
        <div><dt>{t('widgets.sunTimes.sunset')}</dt><dd>{fmtTime(sun.sunset, lang)}</dd></div>
        <div><dt>{t('widgets.sunTimes.dayLength')}</dt><dd>{t('widgets.sunTimes.hm', { h: hours, m: mins })}</dd></div>
        {sun.goldenHour ? <div><dt>{t('widgets.sunTimes.goldenHour')}</dt><dd>{fmtTime(sun.goldenHour, lang)}</dd></div> : null}
        {view.ctx.personas.includes('fisher') || view.ctx.personas.includes('coast') ? (
          <div><dt>{t('widgets.sunTimes.moon')}</dt><dd>{Math.round((sun.moonIllumination ?? 0) * 100)}%</dd></div>
        ) : null}
      </dl>
    </WidgetShell>
  );
}

// ── UV index (WHO categories) ──
export function UvWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const day = view.ctx.hoursOn(env.today).filter((h) => {
    const hr = Number(h.time.slice(11, 13));
    return hr >= 6 && hr <= 18;
  });
  if (!day.length) return <WidgetShell id="uv"><NotAvailable /></WidgetShell>;
  const peak = day.reduce((a, b) => (b.uv > a.uv ? b : a));
  const cat = uvCategory(peak.uv);
  const summary = t('widgets.uv.peak', { uv: Math.round(peak.uv), category: t(`uv.category.${cat}`), time: fmtTime(peak.time, lang) });
  return (
    <WidgetShell id="uv" icon="fa-solid fa-sun">
      <ChartFrame summary={summary}>
        <BarChart
          ariaLabel={summary}
          max={12}
          height={60}
          bars={day.filter((_, i) => i % 2 === 0).map((h) => ({
            key: h.time,
            label: fmtHour(h.time, lang),
            value: h.uv,
            text: String(Math.round(h.uv)),
            className: `ms-bar--uv-${uvCategory(h.uv)}`,
          }))}
        />
      </ChartFrame>
      <p className="ms-muted">{t(`uvAdvice.${cat}`)}</p>
    </WidgetShell>
  );
}

// ── Humidity and feels-like ──
export function HumidityHeatWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const h = view.ctx.hourAt(view.ctx.nowMs);
  if (!h) return <WidgetShell id="humidityHeat"><NotAvailable /></WidgetShell>;
  const peak = upcoming(view, 14).reduce((a, b) => ((b.feelsC ?? -99) > (a.feelsC ?? -99) ? b : a), h);
  const heatWave = view.ctx.officialWarnings.find((w) => ['heat_wave', 'severe_heat_wave', 'hot_humid'].includes(w.hazard));
  return (
    <WidgetShell id="humidityHeat" icon="fa-solid fa-temperature-half">
      <dl className="ms-kv">
        <div><dt>{t('now.humidity')}</dt><dd>{h.rh}%</dd></div>
        {Number.isFinite(h.dewPointC) ? <div><dt>{t('widgets.humidityHeat.dewPoint')}</dt><dd>{fmtTemp(h.dewPointC)}</dd></div> : null}
        <div><dt>{t('now.feelsLike')}</dt><dd>{fmtTemp(h.feelsC)}</dd></div>
        <div><dt>{t('widgets.humidityHeat.peak')}</dt><dd>{fmtTemp(peak.feelsC)} · {fmtTime(peak.time, lang)}</dd></div>
      </dl>
      <p className="ms-muted">
        {heatWave ? t('widgets.humidityHeat.heatWave', { level: t(`levels.${levelName(heatWave.level)}`) }) : t('widgets.humidityHeat.noHeatWave')}
      </p>
      {Number.isFinite(h.tempC) && heatIndexC(h.tempC, h.rh) - h.tempC >= 4 ? <p className="ms-muted">{t('now.whyHotter')}</p> : null}
    </WidgetShell>
  );
}

// ── Heat danger over the working day (PRD 5.8 #29, 8.9) ──
export function HeatDangerWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [a, b] = env.personal?.personaSettings?.work?.hours || ['09:00', '19:00'];
  const from = Number(String(a).slice(0, 2));
  const to = Number(String(b).slice(0, 2));
  const hours = view.ctx.hoursOn(env.today).filter((h) => {
    const hr = Number(h.time.slice(11, 13));
    return hr >= from && hr < to;
  });
  if (!hours.length) return <WidgetShell id="heatDanger"><NotAvailable /></WidgetShell>;
  const danger = hours.filter((h) => h.feelsC >= 41);
  const peak = hours.reduce((x, y) => (y.feelsC > x.feelsC ? y : x));
  const summary = danger.length
    ? t('widgets.heatDanger.danger', { start: fmtTime(danger[0].time, lang), end: fmtTime(danger[danger.length - 1].time, lang), hi: Math.round(peak.feelsC) })
    : t('widgets.heatDanger.ok', { hi: Math.round(peak.feelsC) });
  return (
    <WidgetShell id="heatDanger" icon="fa-solid fa-temperature-high" source={t('widgets.heatDanger.bandsNote')} more={{ href: '/work', label: t('widgets.heatDanger.firstAid') }}>
      <p className="ms-widget-lead">{summary}</p>
      <HourBand ariaLabel={t('widgets.heatDanger.title')} cells={hours.map((h) => heatCell(h, t, lang))} showEvery={2} />
    </WidgetShell>
  );
}
