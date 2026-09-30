"use client";

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import SampleDataBadge from '../shared/SampleDataBadge';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useA11y } from '../../lib/context/A11yProvider';
import { usePlaceSnapshots } from '../../lib/hooks/usePlaceSnapshots';
import { useNow } from '../../lib/hooks/useNow';
import { coolSpotsNear } from '../../data/coolSpots';
import { haversineKm } from '../../lib/mausam/geo';
import { levelName } from '../../lib/mausam/hazards';
import { isActive, minutesAgo } from '../../lib/mausam/reports';
import { fmtDistance } from '../../lib/format';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => <div className="ms-map ms-skeleton"></div> });

const LAYERS = ['places', 'warnings', 'aqi', 'reports', 'cool'];
const UNAVAILABLE = ['radar', 'lightning'];
const GLYPH = {
  places: 'fa-solid fa-location-dot',
  warnings: 'fa-solid fa-triangle-exclamation',
  aqi: 'fa-solid fa-lungs',
  waterlogging: 'fa-solid fa-water',
  sky: 'fa-solid fa-cloud',
  storm: 'fa-solid fa-cloud-bolt',
  fog: 'fa-solid fa-smog',
  cool: 'fa-solid fa-snowflake',
};

/** Map (PRD 9.1, 18.17): layers with a list view for every layer. */
export default function MapPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const weather = useWeather();
  const { lite } = useA11y();
  const now = useNow();
  const [on, setOn] = useState(() => new Set(LAYERS));
  const [view, setView] = useState('map');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const layer = new URLSearchParams(window.location.search).get('layer');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (layer && LAYERS.includes(layer)) setOn(new Set([layer, 'places']));
  }, []);

  const snap = weather.snapshot;
  const current = weather.demo && snap?.place ? snap.place : weather.place;
  const others = useMemo(() => weather.places.filter((p) => p.id !== current.id).slice(0, 5), [weather.places, current.id]);
  const otherSnaps = usePlaceSnapshots(lite ? [] : others, { include: 'air,warnings', lang: lang === 'hi' ? 'hi' : 'en' });

  const items = useMemo(() => {
    const out = [];
    const nm = (p) => (lang === 'hi' && p.nameHi ? p.nameHi : p.name);
    const dist = (p) => haversineKm(current, p);
    const places = [{ ...current, isCurrent: true, snap }, ...others.map((p) => ({ ...p, snap: otherSnaps[p.id] }))];
    for (const p of places) {
      out.push({ layer: 'places', id: `pl-${p.id}`, lat: p.lat, lon: p.lon, pin: p.isCurrent ? 'current' : 'place', glyph: GLYPH.places, title: `${nm(p)}${p.isCurrent ? ` · ${t('map.current')}` : p.type ? ` · ${t(`places.types.${p.type}`)}` : ''}`, km: dist(p) });
      const ws = (p.snap?.warnings || []).filter((w) => w.level >= 2 && (!w.validTo || !now || Date.parse(w.validTo) > now));
      if (ws.length) {
        const top = ws.reduce((a, b) => (b.level > a.level ? b : a));
        const lvl = levelName(top.level);
        out.push({ layer: 'warnings', id: `w-${p.id}`, lat: p.lat, lon: p.lon, pin: `warn-${lvl}`, glyph: GLYPH.warnings, badge: ws.length > 1 ? ws.length : null, title: `${nm(p)}: ${t(`levels.${lvl}`)} · ${t(`hazards.${top.hazard}`, { defaultValue: top.title })}${ws.length > 1 ? ` (+${ws.length - 1})` : ''}`, km: dist(p) });
      }
      const air = p.snap?.air;
      if (air?.aqi != null) {
        out.push({ layer: 'aqi', id: `a-${p.id}`, lat: p.lat, lon: p.lon, pin: `aqi-${air.category}`, glyph: GLYPH.aqi, badge: air.aqi, title: `${nm(p)}: AQI ${air.aqi} · ${t(`aqi.category.${air.category}`)}`, km: dist(p) });
      }
    }
    for (const r of weather.reports.reports) {
      if (now && !isActive(r, now)) continue;
      const storm = r.type === 'sky' && r.label === 'Cb';
      const what =
        r.type === 'waterlogging'
          ? `${t('reports.types.waterlogging')} · ${t(`severity.${r.severity || 1}`)}`
          : r.type === 'sky'
            ? `${t('reports.types.sky')} · ${t(`cloudTypes.${r.label}.name`, { defaultValue: r.label })}`
            : `${t('reports.types.fog')} · ${t(`reports.fogLabels.${r.label}`, { defaultValue: r.label })}`;
      out.push({
        layer: 'reports',
        id: `r-${r.id}`,
        lat: r.lat,
        lon: r.lon,
        pin: r.type === 'waterlogging' ? `water${r.severity || 1}` : storm ? 'storm' : r.type,
        glyph: GLYPH[storm ? 'storm' : r.type],
        title: `${what}${r.areaName ? ` · ${r.areaName}` : ''}${now ? ` · ${t('reports.minutesAgo', { minutes: minutesAgo(r, now) })}` : ''} · ${t(`reportStatus.${r.status}`)}`,
        km: dist(r),
        demo: r.demo,
      });
    }
    for (const s of coolSpotsNear(current, 15)) {
      out.push({ layer: 'cool', id: `c-${s.name}`, lat: s.lat, lon: s.lon, pin: 'cool', glyph: GLYPH.cool, title: `${s.name} · ${t(`coolSpotTypes.${s.type}`)}`, km: s.distanceM / 1000 });
    }
    return out;
  }, [current, others, otherSnaps, snap, weather.reports.reports, now, lang, t]);

  const shown = items.filter((i) => on.has(i.layer));
  const toggle = (l) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  const listMode = lite || view === 'list';
  const cyclone = snap?.cyclone;

  return (
    <>
      <PageHeader title={t('pages.map.title')} subtitle={t('pages.map.subtitle')} />
      {weather.demo ? <p><SampleDataBadge variant="demo" /></p> : null}
      <div className="ms-map-layout">
        <fieldset className="ms-card ms-map-layers">
          <legend>{t('map.layers')}</legend>
          {LAYERS.map((l) => (
            <label key={l} className="ms-habit">
              <input type="checkbox" checked={on.has(l)} onChange={() => toggle(l)} />
              <i className={`${GLYPH[l === 'reports' ? 'waterlogging' : l]}`} aria-hidden="true"></i>
              <span>
                {t(`map.layer.${l}`)} <span className="ms-muted">({items.filter((i) => i.layer === l).length})</span>
              </span>
            </label>
          ))}
          {UNAVAILABLE.map((l) => (
            <p key={l} className="ms-muted ms-map-na">
              <i className="fa-solid fa-ban" aria-hidden="true"></i> {t(`map.layer.${l}`)}: {t('map.notConnected')}
            </p>
          ))}
          {!lite ? (
            <div className="ms-chipgroup" role="group" aria-label={t('map.viewAs')}>
              <button type="button" className="ms-chip-btn" aria-pressed={view === 'map'} onClick={() => setView('map')}>{t('map.asMap')}</button>
              <button type="button" className="ms-chip-btn" aria-pressed={view === 'list'} onClick={() => setView('list')}>{t('map.asList')}</button>
            </div>
          ) : (
            <p className="ms-muted">{t('map.liteList')}</p>
          )}
        </fieldset>
        <div className="ms-map-main">
          {!listMode ? (
            <>
              <LeafletMap items={shown} center={[current.lat, current.lon]} label={t('map.mapLabel', { place: current.name })} onSelect={setSelected} />
              <p className="ms-muted" role="status" aria-live="polite">{selected ? selected.title : t('map.pinHelp')}</p>
            </>
          ) : null}
          {listMode ? (
            <div className="ms-table-wrap" role="region" aria-labelledby="map-list-h" tabIndex={0}>
              <h2 id="map-list-h" className="visually-hidden">{t('map.asList')}</h2>
              <table className="ms-table">
                <caption className="visually-hidden">{t('map.listCaption', { place: current.name })}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('map.colLayer')}</th>
                    <th scope="col">{t('map.colWhat')}</th>
                    <th scope="col">{t('map.colDistance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...shown].sort((a, b) => a.km - b.km).map((i) => (
                    <tr key={i.id}>
                      <td><i className={i.glyph} aria-hidden="true"></i> {t(`map.layer.${i.layer}`)}</td>
                      <td>{i.title}{i.demo ? ` · ${t('common.demoData')}` : ''}</td>
                      <td>{fmtDistance(i.km * 1000, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!shown.length ? <p className="ms-muted">{t('map.nothing')}</p> : null}
            </div>
          ) : null}
          {cyclone ? (
            <p className="ms-card ms-callout ms-callout--danger">
              {t('alerts.cycloneStatus', { name: cyclone.name, km: cyclone.distanceKm, heading: cyclone.heading, speed: cyclone.speedKmh, hours: cyclone.landfallInHours })} {t('map.cycloneNoTrack')}
            </p>
          ) : null}
          <p className="ms-muted">{t('map.note')}</p>
        </div>
      </div>
    </>
  );
}
