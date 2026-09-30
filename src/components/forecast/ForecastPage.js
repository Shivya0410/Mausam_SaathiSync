"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import NowCard from '../home/NowCard';
import ChartFrame from '../charts/ChartFrame';
import LineChart from '../charts/LineChart';
import WeatherIcon from '../shared/WeatherIcon';
import { useWeather } from '../../lib/context/WeatherProvider';
import { usePlaceSnapshots } from '../../lib/hooks/usePlaceSnapshots';
import { useNow } from '../../lib/hooks/useNow';
import { localParts, sliceHours, daysBetween } from '../../lib/mausam/time';
import { fmtHour, fmtTemp, fmtTime, fmtWeekday, fmtDate, fmtVisibility, relativeDay } from '../../lib/format';
import { uvCategory } from '../../lib/mausam/indices/uv';
import { upsertPlace } from '../../lib/stores';

/** One-line description of the next 48 hours for screen readers and everyone. */
function summary48(hours, t, lang) {
  if (!hours.length) return '';
  const temps = hours.map((h) => h.tempC);
  const max = hours[temps.indexOf(Math.max(...temps))];
  const min = hours[temps.indexOf(Math.min(...temps))];
  const rain = hours.filter((h) => h.precipProb >= 50);
  return t('forecast.summary48', {
    max: fmtTemp(max.tempC),
    maxTime: fmtTime(max.time, lang),
    min: fmtTemp(min.tempC),
    minTime: fmtTime(min.time, lang),
    rain: rain.length ? t('forecast.rainFrom', { time: fmtTime(rain[0].time, lang) }) : t('forecast.noRain'),
  });
}

export default function ForecastPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const weather = useWeather();
  const now = useNow();
  const [placeId, setPlaceId] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaceId(new URLSearchParams(window.location.search).get('place'));
  }, []);
  const other = placeId ? weather.places.find((p) => p.id === placeId && p.id !== weather.place.id) : null;
  const otherSnap = usePlaceSnapshots(other ? [other] : [], { include: 'air,warnings,sun', lang: lang === 'hi' ? 'hi' : 'en' });
  const snapshot = other ? otherSnap[other.id] : weather.snapshot;
  const place = other || weather.place;
  const saved = weather.places.some((p) => p.id === place.id);
  const offsetMin = (snapshot?.utcOffsetSeconds ?? 19800) / 60;
  const today = now ? localParts(now, offsetMin).date : null;
  const hours = snapshot && now ? sliceHours(snapshot.hourly, now, 48) : [];
  const days = (snapshot?.daily || []).filter((d) => !today || d.date >= today);
  const cur = snapshot?.current;
  const abroad = snapshot && snapshot.utcOffsetSeconds !== 19800;
  const s48 = summary48(hours, t, lang);
  const name = lang === 'hi' && place.nameHi ? place.nameHi : place.name;

  return (
    <>
      <PageHeader title={t('forecast.title', { place: name })} subtitle={t('pages.forecast.subtitle')} />
      {!saved ? (
        <p>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => weather.setPlaces((l) => upsertPlace(l, place))}>
            <i className="fa-regular fa-star" aria-hidden="true"></i> {t('forecast.save')}
          </button>
        </p>
      ) : null}
      {abroad ? <p className="ms-muted">{t('forecast.localTime', { place: name })}</p> : null}
      <NowCard snapshot={snapshot} status={other ? (snapshot ? 'ready' : 'loading') : weather.status} now={now} today={today} compact onRetry={weather.refresh} />

      <section className="ms-card" aria-labelledby="fc-48">
        <h2 id="fc-48">{t('forecast.next48')}</h2>
        {hours.length ? (
          <ChartFrame
            summary={s48}
            table={{
              caption: t('forecast.next48'),
              columns: [
                { key: 'time', label: t('charts.time') },
                { key: 'temp', label: t('charts.temp') },
                { key: 'feels', label: t('now.feelsLike') },
                { key: 'rain', label: t('charts.rainChance') },
                { key: 'mm', label: t('charts.rainMm') },
                { key: 'wind', label: t('charts.wind') },
              ],
              rows: hours.map((h) => ({
                key: h.time,
                time: `${relativeDay(h.time.slice(0, 10), today) === 'tomorrow' ? t('common.tomorrow') + ' ' : ''}${fmtHour(h.time, lang)}`,
                temp: fmtTemp(h.tempC),
                feels: fmtTemp(h.feelsC),
                rain: `${h.precipProb}%`,
                mm: h.precipMm,
                wind: `${Math.round(h.windKmh)} ${t('units.kmh')}`,
              })),
            }}
          >
            <LineChart
              ariaLabel={s48}
              xLabels={hours.map((h) => fmtHour(h.time, lang))}
              series={[
                { id: 'temp', label: t('charts.temp'), values: hours.map((h) => h.tempC) },
                { id: 'feels', label: t('now.feelsLike'), values: hours.map((h) => h.feelsC), className: 'is-feels', dashed: true },
              ]}
              bars={{ label: t('charts.rainChance'), values: hours.map((h) => h.precipProb), max: 100 }}
            />
            <p className="ms-legend-inline">
              <span className="ms-key ms-key--temp"></span> {t('charts.temp')} <span className="ms-key ms-key--feels"></span> {t('now.feelsLike')}{' '}
              <span className="ms-key ms-key--rain"></span> {t('charts.rainChance')}
            </p>
          </ChartFrame>
        ) : (
          <div className="ms-skeleton"></div>
        )}
      </section>

      <section className="ms-card" aria-labelledby="fc-16">
        <h2 id="fc-16">{t('forecast.next16')}</h2>
        <div className="ms-table-wrap" role="region" aria-labelledby="fc-16" tabIndex={0}>
          <table className="ms-table ms-days16">
            <thead>
              <tr>
                <th scope="col">{t('charts.day')}</th>
                <th scope="col">{t('forecast.condition')}</th>
                <th scope="col">{t('now.high')} / {t('now.low')}</th>
                <th scope="col">{t('charts.rainChance')}</th>
                <th scope="col">{t('charts.rainMm')}</th>
                <th scope="col">{t('forecast.windMax')}</th>
                <th scope="col">UV</th>
                <th scope="col">{t('widgets.sunTimes.sunrise')} / {t('widgets.sunTimes.sunset')}</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const far = today && daysBetween(today, d.date) >= 7;
                const rel = relativeDay(d.date, today);
                return (
                  <tr key={d.date} className={far ? 'is-far' : ''}>
                    <th scope="row">
                      {rel ? t(`common.${rel}`) : fmtWeekday(d.date, lang)} <span className="ms-muted">{fmtDate(d.date, lang, { weekday: undefined })}</span>
                    </th>
                    <td>
                      <WeatherIcon code={d.wmo} size={20} /> {t(`wmo.${d.wmo}`)}
                    </td>
                    <td>
                      {fmtTemp(d.maxC)} / {fmtTemp(d.minC)}
                    </td>
                    <td>{d.precipProbMax}%</td>
                    <td>{Math.round(d.precipMm * 10) / 10}</td>
                    <td>{Math.round(d.gustMaxKmh)} {t('units.kmh')}</td>
                    <td>
                      {Math.round(d.uvMax)} <span className="ms-muted">{t(`uv.category.${uvCategory(d.uvMax)}`)}</span>
                    </td>
                    <td>
                      {fmtTime(d.sunrise, lang)} / {fmtTime(d.sunset, lang)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="ms-muted">{t('forecast.lowerConfidence')}</p>
      </section>

      {cur ? (
        <section className="ms-card" aria-labelledby="fc-details">
          <h2 id="fc-details">{t('forecast.details')}</h2>
          <dl className="ms-kv">
            <div><dt>{t('now.humidity')}</dt><dd>{cur.rh}%</dd></div>
            {hours[0]?.dewPointC != null ? <div><dt>{t('widgets.humidityHeat.dewPoint')}</dt><dd>{fmtTemp(hours[0].dewPointC)}</dd></div> : null}
            {cur.visibilityM != null ? <div><dt>{t('widgets.visibility.title')}</dt><dd>{fmtVisibility(cur.visibilityM, lang)}</dd></div> : null}
            {hours[0] ? <div><dt>{t('forecast.cloud')}</dt><dd>{hours[0].cloudPct}%</dd></div> : null}
            <div><dt>UV</dt><dd>{Math.round(cur.uv)} · {t(`uv.category.${uvCategory(cur.uv)}`)}</dd></div>
            {snapshot.air ? <div><dt>AQI</dt><dd>{snapshot.air.aqi} · {t(`aqi.category.${snapshot.air.category}`)}</dd></div> : null}
            {snapshot.sun ? <div><dt>{t('widgets.sunTimes.sunrise')}</dt><dd>{fmtTime(snapshot.sun.sunrise, lang)}</dd></div> : null}
            {snapshot.sun ? <div><dt>{t('widgets.sunTimes.sunset')}</dt><dd>{fmtTime(snapshot.sun.sunset, lang)}</dd></div> : null}
            {snapshot.sun ? <div><dt>{t('widgets.sunTimes.moon')}</dt><dd>{Math.round(snapshot.sun.moonIllumination * 100)}%</dd></div> : null}
          </dl>
        </section>
      ) : null}

      {snapshot ? (
        <section className="ms-card" aria-labelledby="fc-sources">
          <h2 id="fc-sources">{t('forecast.sources')}</h2>
          <ul className="ms-list">
            {(snapshot.sources || []).map((src) => (
              <li key={src.name}>
                <strong>{t(`sources.${src.name}`, { defaultValue: src.name })}</strong>: {src.fields.map((f) => t(`forecast.fields.${f}`, { defaultValue: f })).join(', ')}
                {src.updatedAt ? ` · ${fmtTime(src.updatedAt, lang)}` : ''}
              </li>
            ))}
            <li>{t('sources.calculated')}: {t('forecast.fields.sun')}</li>
          </ul>
          <p className="ms-muted">{t('forecast.modelNote')}</p>
        </section>
      ) : null}
    </>
  );
}
