"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { Tips, ChipGroup } from '../persona/Sections';
import { useStore } from '../../lib/hooks/useStore';
import { useWeather } from '../../lib/context/WeatherProvider';
import { stores, upsertById, removeById, newId } from '../../lib/stores';
import { comfortBand, SLOTS } from '../../lib/mausam/indices/comfortIndex';
import { addDays, daysBetween } from '../../lib/mausam/time';
import { scoreBand } from '../widgets/shared';
import { fmtDate, fmtTemp, fmtTime } from '../../lib/format';
import { dateComfort } from '../../lib/mausam/plans';

function useClimatologyFor(place, dates) {
  const [data, setData] = useState({});
  const key = `${place?.lat},${place?.lon}|${dates.join(',')}`;
  useEffect(() => {
    if (!place || !dates.length) return undefined;
    let cancelled = false;
    Promise.all(
      dates.map(async (date) => {
        const [, m, d] = date.split('-').map(Number);
        const p = new URLSearchParams({ lat: place.lat.toFixed(2), lon: place.lon.toFixed(2), month: String(m), day: String(d) });
        try {
          const r = await fetch(`/api/mausam/climatology?${p}`);
          return [date, r.ok ? await r.json() : null];
        } catch {
          return [date, null];
        }
      }),
    ).then((pairs) => {
      if (!cancelled) setData(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return data;
}

const EMPTY = { name: '', date: '', slot: 'evening', outdoor: true, guests: 'mid' };

/** Event planner (PRD 8.8). */
export default function EventsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { place } = useWeather();
  const [events, setEvents] = useStore(stores.events);
  const [draft, setDraft] = useState(EMPTY);
  const [compare, setCompare] = useState(['', '', '']);
  const [slot, setSlot] = useState('evening');
  const [error, setError] = useState(false);
  const chosen = compare.filter(Boolean);
  const [todayGuess] = useState(() => new Date().toISOString().slice(0, 10));
  const farDates = chosen.filter((d) => daysBetween(todayGuess, d) > 16);
  const clim = useClimatologyFor(place, farDates);

  const save = (e) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.date) return setError(true);
    setEvents((list) => upsertById(list, { ...draft, id: newId('ev'), name: draft.name.trim().slice(0, 60) }));
    setDraft(EMPTY);
    setError(false);
  };

  return (
    <PersonaPage persona="events" pageKey="events" hero="eventComfort" widgets={['daily', 'wind', 'aqi', 'sunTimes']} learn={['rainChance', 'lightning']}>
      {({ view, env }) => {
        if (!view) return null;
        const today = env.today;
        const results = chosen.map((date) => {
          const c = dateComfort(view.ctx, date, slot);
          return { date, c, clim: clim[date] || null };
        });
        const best = results.filter((r) => r.c).sort((a, b) => b.c.score - a.c.score)[0];
        const cal = Array.from({ length: 16 }, (_, i) => addDays(today, i)).map((date) => ({ date, c: dateComfort(view.ctx, date, slot) }));
        return (
          <>
            <section className="ms-card" aria-labelledby="e-list">
              <h2 id="e-list">{t('events.mine')}</h2>
              {events.length ? (
                <ul className="ms-list ms-list--plain">
                  {events.map((ev) => {
                    const c = dateComfort(view.ctx, ev.date, ev.slot);
                    return (
                      <li key={ev.id} className="ms-row">
                        <span>
                          <strong>{ev.name}</strong> · {fmtDate(ev.date, lang)} · {t(`slots.${ev.slot}`)} · {t(ev.outdoor ? 'events.outdoor' : 'events.indoor')}
                          {c ? ` · ${t('widgets.eventComfort.comfort')} ${c.score} (${t(`verdicts.comfort.${comfortBand(c.score)}`)}) · ${t('charts.rainChance')} ${Math.round(c.precipProbMax)}%` : ` · ${t('widgets.eventComfort.beyond')}`}
                        </span>
                        <button type="button" className="ms-chip-btn" onClick={() => setEvents((l) => removeById(l, ev.id))} aria-label={t('events.remove', { name: ev.name })}>
                          <i className="fa-solid fa-trash" aria-hidden="true"></i>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="ms-muted">{t('empty.events')}</p>
              )}
              <form onSubmit={save} className="ms-form" noValidate aria-labelledby="e-add">
                <h3 id="e-add">{t('events.add')}</h3>
                <label className="ms-field">
                  <span>{t('onboarding.details.eventName')}</span>
                  <input type="text" maxLength={60} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-invalid={error && !draft.name.trim()} />
                </label>
                <label className="ms-field">
                  <span>{t('onboarding.details.eventDate')}</span>
                  <input type="date" min={today} value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} aria-invalid={error && !draft.date} />
                </label>
                <ChipGroup label={t('events.slot')} options={Object.keys(SLOTS).map((s) => ({ value: s, label: t(`slots.${s}`) }))} value={draft.slot} onChange={(v) => setDraft((d) => ({ ...d, slot: v }))} />
                <ChipGroup label={t('events.where')} options={[{ value: true, label: t('events.outdoor') }, { value: false, label: t('events.indoor') }]} value={draft.outdoor} onChange={(v) => setDraft((d) => ({ ...d, outdoor: v }))} />
                <ChipGroup label={t('events.guests')} options={['small', 'mid', 'large'].map((g) => ({ value: g, label: t(`events.guestBands.${g}`) }))} value={draft.guests} onChange={(v) => setDraft((d) => ({ ...d, guests: v }))} />
                {error ? <p className="ms-error" role="alert">{t('events.error')}</p> : null}
                <button type="submit" className="ms-btn"><i className="fa-solid fa-plus" aria-hidden="true"></i> {t('events.save')}</button>
              </form>
            </section>

            <section className="ms-card" aria-labelledby="e-compare">
              <h2 id="e-compare">{t('events.compare')}</h2>
              <div className="ms-row-fields">
                {compare.map((d, i) => (
                  <label key={i} className="ms-field">
                    <span>{t('events.dateN', { n: i + 1 })}</span>
                    <input type="date" min={today} value={d} onChange={(e) => setCompare((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
                  </label>
                ))}
              </div>
              <ChipGroup label={t('events.slot')} options={Object.keys(SLOTS).map((s) => ({ value: s, label: t(`slots.${s}`) }))} value={slot} onChange={setSlot} />
              {results.length ? (
                <div className="ms-table-wrap" role="region" aria-labelledby="e-compare" tabIndex={0}>
                  <table className="ms-table">
                    <thead>
                      <tr>
                        <th scope="col">{t('charts.day')}</th>
                        {results.map((r) => (
                          <th key={r.date} scope="col">
                            {fmtDate(r.date, lang)} {best && best.date === r.date ? <span className="ms-kind ms-kind--good">{t('events.recommended')}</span> : null}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['comfort', (r) => (r.c ? `${r.c.score} · ${t(`verdicts.comfort.${comfortBand(r.c.score)}`)}` : r.clim ? t('events.pastYears') : '–')],
                        ['rain', (r) => (r.c ? `${Math.round(r.c.precipProbMax)}%` : r.clim ? t('rules.events.climatology.headline', { n: r.clim.rainyYears, years: r.clim.yearsCounted }) : '–')],
                        ['temp', (r) => (r.c ? `${fmtTemp(r.c.day.maxC)} → ${fmtTemp(r.c.day.minC)}` : r.clim ? `${fmtTemp(r.clim.typicalMaxC)} → ${fmtTemp(r.clim.typicalMinC)}` : '–')],
                        ['humidity', (r) => (r.c && Number.isFinite(r.c.rh) ? `${Math.round(r.c.rh)}%` : '–')],
                        ['gust', (r) => (r.c ? `${Math.round(r.c.gustMax)} ${t('units.kmh')}` : r.clim?.typicalGustKmh != null ? `${Math.round(r.clim.typicalGustKmh)} ${t('units.kmh')}` : '–')],
                        ['aqi', (r) => (r.c?.aqi != null ? String(r.c.aqi) : '–')],
                        ['sunset', (r) => (r.c?.day?.sunset ? fmtTime(r.c.day.sunset, lang) : '–')],
                      ].map(([k, fn]) => (
                        <tr key={k}>
                          <th scope="row">{t(`events.rows.${k}`)}</th>
                          {results.map((r) => <td key={r.date}>{fn(r)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="ms-muted">{t('events.compareHint')}</p>
              )}
              {best ? <p>{t('events.why', { date: fmtDate(best.date, lang), score: best.c.score })}</p> : null}
              {farDates.length ? <p className="ms-muted">{t('rules.events.climatology.reason')}</p> : null}
            </section>

            <section className="ms-card" aria-labelledby="e-cal">
              <h2 id="e-cal">{t('events.calendar', { slot: t(`slots.${slot}`) })}</h2>
              <ol className="ms-calendar">
                {cal.map(({ date, c }) => {
                  const band = c ? scoreBand(c.score) : null;
                  return (
                    <li key={date} className={`ms-cal-cell ${band ? `ms-band--${band}` : 'ms-cal-none'}`}>
                      <span className="ms-cal-date">{fmtDate(date, lang, { month: undefined })}</span>
                      <span className="ms-cal-score">{c ? c.score : '–'}</span>
                      <span className="visually-hidden">{c ? t(`verdicts.comfort.${comfortBand(c.score)}`) : t('common.notAvailableShort')}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="ms-muted">{t('events.calendarNote')}</p>
            </section>

            <Tips id="e-backup" titleKey="events.backupTitle" listKey="events.backupTips" icon="fa-solid fa-clipboard-check" />
          </>
        );
      }}
    </PersonaPage>
  );
}
