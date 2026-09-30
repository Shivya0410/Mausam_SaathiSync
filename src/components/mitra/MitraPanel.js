"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Dialog from '../shared/Dialog';
import ListenButton from '../shared/ListenButton';
import VoiceButton from './VoiceButton';
import { useWeather, usePersonas } from '../../lib/context/WeatherProvider';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { useLanguage } from '../../lib/i18n/useLanguage';
import { respond, STARTERS } from '../../lib/mitra/respond';
import { fetchSnapshot, snapshotUrl } from '../../lib/hooks/useSnapshot';

async function geocode(query) {
  const r = await fetch(`/api/mausam/places/search?q=${encodeURIComponent(query)}`);
  if (!r.ok) return null;
  const j = await r.json();
  const hit = (j.results || [])[0];
  return hit && Number.isFinite(hit.lat) ? { id: `geo-${hit.id ?? hit.name}`, name: hit.name, lat: hit.lat, lon: hit.lon, district: hit.admin2, state: hit.admin1 } : null;
}

async function getAirport(icao) {
  const r = await fetch(`/api/mausam/airport?icao=${icao}`);
  if (!r.ok) return null;
  const j = await r.json();
  return j.airports?.[0]?.metar || null;
}

/**
 * Mausam Mitra (PRD 10, 18.9, 20.12): grounded, deterministic weather
 * assistant. Floating button above the tab bar; full-screen sheet on
 * mobile. The conversation lives in memory for this session only.
 */
export default function MitraPanel() {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useLanguage();
  const weather = useWeather();
  const personas = usePersonas();
  const [settings] = useStore(stores.personaSettings);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [interim, setInterim] = useState('');
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

  const starters = useMemo(() => {
    const ids = personas.ids;
    const set = STARTERS[ids.find((p) => STARTERS[p]) || 'default'];
    return set.map((k) => t(`mitra.starters.${k}`));
  }, [personas.ids, t]);

  const ask = async (text) => {
    const q = text.trim();
    if (!q || busy) return;
    setDraft('');
    setInterim('');
    setMessages((m) => [...m, { from: 'user', text: q }]);
    setBusy(true);
    try {
      const lang = i18n.language === 'hi' ? 'hi' : 'en';
      const r = await respond(q, {
        uiLang: lang,
        tFor: (l) => i18n.getFixedT(l),
        // In a demo scenario the snapshot's place is the one on screen.
        place: weather.demo && weather.snapshot?.place ? weather.snapshot.place : weather.place,
        places: weather.places,
        snapshot: weather.snapshot,
        personas: personas.ids,
        personaSettings: settings,
        reports: weather.reports.reports,
        getSnapshot: (place, { marine } = {}) =>
          fetchSnapshot(snapshotUrl(place, { include: `air,warnings,sun${marine ? ',marine' : ''}`, lang, demo: weather.demo })),
        geocode,
        getAirport,
      });
      if (r.kind === 'switch') setLanguage(r.switchTo);
      setMessages((m) => [...m, { from: 'bot', ...r }]);
    } catch {
      setMessages((m) => [...m, { from: 'bot', kind: 'error', text: t('mitra.error'), lines: [], chips: [] }]);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    ask(draft);
  };

  return (
    <>
      <button type="button" className="ms-mitra-fab" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
        <span className="ms-mitra-fab-label">{t('mitra.open')}</span>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('mitra.title')} labelledBy="mitra-title" className="ms-mitra">
        <div className="ms-mitra-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions" aria-label={t('mitra.title')}>
          <div className="ms-bubble ms-bubble--bot">
            <p>{t('mitra.intro')}</p>
          </div>
          {messages.map((m, i) =>
            m.from === 'user' ? (
              <div key={i} className="ms-bubble ms-bubble--user" lang={undefined}>
                <span className="visually-hidden">{t('mitra.you')}: </span>
                {m.text}
              </div>
            ) : (
              <div key={i} className={`ms-bubble ms-bubble--bot ${m.kind === 'emergency' ? 'ms-bubble--emergency' : ''}`} lang={m.lang}>
                {m.kind === 'emergency' ? (
                  <p className="ms-mitra-calls">
                    {m.calls.slice(0, 2).map((n) => (
                      <a key={n} href={`tel:${n}`} className="ms-btn ms-btn--danger">
                        <i className="fa-solid fa-phone" aria-hidden="true"></i> {t('mitra.call', { number: n, lng: m.lang })}
                      </a>
                    ))}
                  </p>
                ) : null}
                <p>{m.text}</p>
                {m.lines?.length ? (
                  <ul className="ms-list">
                    {m.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : null}
                {m.kind === 'emergency' ? (
                  <p className="ms-mitra-calls">
                    {m.calls.slice(2).map((n) => (
                      <a key={n} href={`tel:${n}`} className="ms-chip-btn">
                        <i className="fa-solid fa-phone" aria-hidden="true"></i> {n}
                      </a>
                    ))}
                  </p>
                ) : null}
                {m.source ? <p className="ms-muted ms-mitra-source">{m.source}</p> : null}
                <div className="ms-mitra-actions">
                  {(m.chips || []).map((c) =>
                    c.href ? (
                      <Link key={c.label} href={c.href} className="ms-chip-btn" onClick={() => setOpen(false)}>
                        {c.label} <i className="fa-solid fa-angle-right" aria-hidden="true"></i>
                      </Link>
                    ) : (
                      <button key={c.label} type="button" className="ms-chip-btn" onClick={() => ask(c.send)}>
                        {c.label}
                      </button>
                    ),
                  )}
                  <ListenButton text={[m.text, ...(m.lines || [])].join('. ')} lang={m.lang} compact />
                </div>
              </div>
            ),
          )}
          {busy ? (
            <div className="ms-bubble ms-bubble--bot" aria-busy="true">
              <p className="ms-muted">{t('mitra.thinking')}</p>
            </div>
          ) : null}
        </div>
        {!messages.length ? (
          <div className="ms-mitra-starters" role="group" aria-label={t('mitra.suggestions')}>
            {starters.map((s) => (
              <button key={s} type="button" className="ms-chip-btn" onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
        <form className="ms-mitra-form" onSubmit={submit}>
          <label htmlFor="mitra-input" className="visually-hidden">
            {t('mitra.inputLabel')}
          </label>
          <input
            id="mitra-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={interim || t('mitra.placeholder')}
            autoComplete="off"
            maxLength={300}
          />
          <VoiceButton onText={(x) => ask(x)} onInterim={setInterim} />
          <button type="submit" className="ms-icon-btn ms-mitra-send" aria-label={t('mitra.send')} disabled={busy || !draft.trim()}>
            <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
          </button>
        </form>
        <p className="ms-muted ms-mitra-note">{t('mitra.sessionNote')}</p>
      </Dialog>
    </>
  );
}
