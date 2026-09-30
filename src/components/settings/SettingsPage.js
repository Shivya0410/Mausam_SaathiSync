"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import PlaceSearch from '../places/PlaceSearch';
import { ChipGroup } from '../persona/Sections';
import { useStore, useHydrated } from '../../lib/hooks/useStore';
import { useWeather, usePersonas, DEMO_MODE } from '../../lib/context/WeatherProvider';
import { useA11y, TEXT_SCALES } from '../../lib/context/A11yProvider';
import { useLanguage } from '../../lib/i18n/useLanguage';
import { usePersonal } from '../../lib/hooks/usePersonal';
import { useAuth } from '../../store/auth';
import {
  stores, toPlace, upsertPlace, removePlace, movePlace, PLACE_TYPES, personasFromChoices, toggleChoice,
  togglePin, toggleHide, moveWidget, resetLayout,
} from '../../lib/stores';
import { listMausamKeys, readKey, clearKeys } from '../../lib/stores/deviceStore';
import { PERSONAS, MAX_PERSONAS } from '../../config/personas';
import { LANGUAGES } from '../../config/site';
import { WIDGETS } from '../../config/widgets';
import { SCENARIO_IDS } from '../../data/fixtures/scenarios';
import { effectiveNotify } from '../../lib/mausam/notify';

const TILES = PERSONAS.filter((p) => p.tile || p.id === 'fisher');

function Section({ id, title, children }) {
  return (
    <section className="ms-card" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <div className="ms-switch-row">
      <button type="button" role="switch" aria-checked={Boolean(checked)} className="ms-switch" onClick={() => onChange(!checked)}>
        <span className="ms-switch-track" aria-hidden="true"><span className="ms-switch-thumb"></span></span>
        <span>{label}</span>
      </button>
    </div>
  );
}

/** Human-readable name for a stored key (Settings > Data, DPDP rights). */
function keyLabel(k, t) {
  const base = k.split('::')[0].replace(/\.v\d+.*$/, '').replace(/^mausam\./, '');
  if (base.startsWith('cache.snapshot')) return t('settings.data.keys.cache');
  return t(`settings.data.keys.${base}`, { defaultValue: base });
}

function rankReasonText(r, t) {
  if (!r) return '';
  const parts = [];
  if (r.pinned) parts.push(t('settings.layout.reason.pinned'));
  if (r.persona) parts.push(t('settings.layout.reason.persona', { persona: t(`personas.${r.persona}.name`) }));
  if (r.season) parts.push(t('settings.layout.reason.season', { season: t(`seasonNames.${r.season}`) }));
  if (r.timeOfDay) parts.push(t('settings.layout.reason.time', { time: t(`timeOfDay.${r.timeOfDay}`) }));
  if (r.urgent) parts.push(t(`settings.layout.reason.${r.urgent}`));
  return parts.join(', ');
}

/** Settings (PRD 9.5). */
export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const router = useRouter();
  const weather = useWeather();
  const personas = usePersonas();
  const personal = usePersonal();
  const a11y = useA11y();
  const { language, setLanguage } = useLanguage();
  const { isLoggedIN, LogoutUser } = useAuth();
  const [settings, setSettings] = useStore(stores.personaSettings);
  const [layout, setLayout] = useStore(stores.layout);
  const [notify, setNotify] = useStore(stores.notify);
  const [usage, setUsage] = useStore(stores.usage);
  const [, setOnboarding] = useStore(stores.onboarding);
  const [newType, setNewType] = useState('home');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState(null);
  const hydrated = useHydrated();
  const places = weather.places;
  const choices = [personas.state.primary, ...personas.state.secondary].filter(Boolean);
  const ranked = personal.view?.ranked || [];
  const visibleIds = ranked.map((r) => r.id);
  const shownNotify = effectiveNotify(notify, personas.ids);
  const setS = (p, patch) => setSettings((s) => ({ ...s, [p]: { ...s[p], ...patch } }));

  const exportData = () => {
    const data = Object.fromEntries(listMausamKeys().filter((k) => !k.includes('cache.snapshot')).map((k) => [k, readKey(k, null)]));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Mausam Saathi', data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mausam-saathi-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const deleteAll = () => {
    const n = clearKeys('mausam.');
    setConfirmDelete(false);
    setMessage(t('settings.data.deleted', { count: n }));
  };
  const testAlert = async () => {
    if (typeof Notification === 'undefined') return setMessage(t('onboarding.notify.unsupported'));
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p !== 'granted') return setMessage(t('onboarding.notify.denied'));
    try {
      new Notification(t('settings.notify.testTitle'), { body: t('settings.notify.testBody'), tag: 'test' });
      setMessage(t('settings.notify.testSent'));
    } catch {
      setMessage(t('settings.notify.testFailed'));
    }
  };

  return (
    <>
      <PageHeader title={t('pages.settings.title')} subtitle={t('pages.settings.subtitle')} />
      {message ? <p className="ms-card" role="status">{message}</p> : null}
      <nav className="ms-card" aria-label={t('settings.jump')}>
        <ul className="ms-link-list">
          {['places', 'personas', 'layout', 'notifications', 'language', 'accessibility', 'data', ...(DEMO_MODE ? ['demo'] : []), 'account', 'about'].map((id) => (
            <li key={id}><a href={`#${id}`} className="ms-chip ms-chip--link">{t(`settings.sections.${id}`)}</a></li>
          ))}
        </ul>
      </nav>

      <Section id="places" title={t('settings.sections.places')}>
        {places.length ? (
          <ol className="ms-list ms-list--plain">
            {places.map((p, i) => (
              <li key={p.id} className="ms-row">
                <span>
                  <strong>{lang === 'hi' && p.nameHi ? p.nameHi : p.name}</strong> · {t(`places.types.${p.type}`)}
                  {p.id === weather.place.id ? ` · ${t('settings.places.current')}` : ''}
                </span>
                <span className="ms-row-actions">
                  <button type="button" className="ms-chip-btn" onClick={() => weather.setCurrentPlace(p.id)} disabled={p.id === weather.place.id}>{t('settings.places.use')}</button>
                  <button type="button" className="ms-chip-btn" onClick={() => weather.setPlaces((l) => movePlace(l, p.id, -1))} disabled={i === 0} aria-label={t('settings.moveUp', { name: p.name })}><i className="fa-solid fa-arrow-up" aria-hidden="true"></i></button>
                  <button type="button" className="ms-chip-btn" onClick={() => weather.setPlaces((l) => movePlace(l, p.id, 1))} disabled={i === places.length - 1} aria-label={t('settings.moveDown', { name: p.name })}><i className="fa-solid fa-arrow-down" aria-hidden="true"></i></button>
                  <button type="button" className="ms-chip-btn" onClick={() => weather.setPlaces((l) => removePlace(l, p.id))} aria-label={t('settings.places.remove', { name: p.name })}><i className="fa-solid fa-trash" aria-hidden="true"></i></button>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ms-muted">{t('settings.places.none')}</p>
        )}
        <ChipGroup label={t('settings.places.type')} options={PLACE_TYPES.map((x) => ({ value: x, label: t(`places.types.${x}`) }))} value={newType} onChange={setNewType} />
        <PlaceSearch labelKey="settings.places.add" onSelect={(r) => weather.setPlaces((l) => upsertPlace(l, toPlace(r, { type: newType })))} />
        <p className="ms-muted">{t('settings.places.privacy')}</p>
      </Section>

      <Section id="personas" title={t('settings.sections.personas')}>
        <p className="ms-muted">{t('settings.personas.help', { max: MAX_PERSONAS })}</p>
        <div className="ms-chipgroup" role="group" aria-label={t('settings.sections.personas')}>
          {TILES.map((p) => (
            <button key={p.id} type="button" className="ms-chip-btn" aria-pressed={choices.includes(p.id)} onClick={() => personas.set(personasFromChoices(toggleChoice(choices, p.id)))}>
              {t(p.nameKey)}
              {personas.state.primary === p.id ? ` · ${t('settings.personas.primary')}` : ''}
            </button>
          ))}
        </div>
        {choices.includes('commute') ? (
          <fieldset className="ms-fieldset">
            <legend>{t('personas.commute.name')}</legend>
            <div className="ms-row-fields">
              <label className="ms-field"><span>{t('onboarding.details.leaveHome')}</span><input type="time" value={settings.commute.times[0] || ''} onChange={(e) => setS('commute', { times: [e.target.value, settings.commute.times[1] || ''] })} /></label>
              <label className="ms-field"><span>{t('onboarding.details.leaveWork')}</span><input type="time" value={settings.commute.times[1] || ''} onChange={(e) => setS('commute', { times: [settings.commute.times[0] || '', e.target.value] })} /></label>
              <label className="ms-field"><span>{t('settings.personas.travelMin')}</span><input type="number" min={5} max={180} value={settings.commute.travelMin} onChange={(e) => setS('commute', { travelMin: Math.max(5, Math.min(180, Number(e.target.value) || 45)) })} /></label>
            </div>
            <ChipGroup label={t('onboarding.details.mode')} options={['two_wheeler', 'car', 'public', 'walk', 'cycle'].map((m) => ({ value: m, label: t(`modes.${m}`) }))} value={settings.commute.mode} onChange={(v) => setS('commute', { mode: v })} />
            <p className="ms-muted">{t('settings.personas.homeWork')}</p>
          </fieldset>
        ) : null}
        {choices.includes('work') ? (
          <fieldset className="ms-fieldset">
            <legend>{t('personas.work.name')}</legend>
            <div className="ms-row-fields">
              <label className="ms-field"><span>{t('onboarding.details.workFrom')}</span><input type="time" value={settings.work.hours[0]} onChange={(e) => setS('work', { hours: [e.target.value, settings.work.hours[1]] })} /></label>
              <label className="ms-field"><span>{t('onboarding.details.workTo')}</span><input type="time" value={settings.work.hours[1]} onChange={(e) => setS('work', { hours: [settings.work.hours[0], e.target.value] })} /></label>
            </div>
            <ChipGroup label={t('settings.personas.workType')} options={['delivery', 'construction', 'vending', 'other'].map((w) => ({ value: w, label: t(`workTypes.${w}`) }))} value={settings.work.type} onChange={(v) => setS('work', { type: v })} />
          </fieldset>
        ) : null}
        <p className="ms-actions">
          <Link href="/family" className="ms-chip ms-chip--link">{t('settings.personas.schoolTimes')}</Link>
          <Link href="/run" className="ms-chip ms-chip--link">{t('settings.personas.fitness')}</Link>
          <Link href="/travel" className="ms-chip ms-chip--link">{t('settings.personas.trips')}</Link>
          <Link href="/events" className="ms-chip ms-chip--link">{t('settings.personas.events')}</Link>
          <Link href="/household" className="ms-chip ms-chip--link">{t('pages.household.title')}</Link>
        </p>
        <Switch checked={!usage.nudgesOff} onChange={(v) => setUsage((u) => ({ ...u, nudgesOff: !v }))} label={t('settings.personas.nudges')} />
        <button type="button" className="ms-btn ms-btn--secondary" onClick={() => { setOnboarding({ completedAt: null, version: 1 }); router.push('/onboarding'); }}>
          {t('settings.personas.redoSetup')}
        </button>
      </Section>

      <Section id="layout" title={t('settings.sections.layout')}>
        <p className="ms-muted">{t('settings.layout.help')}</p>
        <ol className="ms-layout-list">
          {ranked.map((r, i) => {
            const pinned = layout.pinned.includes(r.id);
            const name = t(`widgets.${r.id}.title`);
            return (
              <li key={r.id}>
                <div>
                  <strong>{i + 1}. {name}</strong> {pinned ? <span className="ms-kind ms-kind--tip">{t('settings.layout.pinned')}</span> : null}
                  <p className="ms-muted">{t('settings.layout.shownBecause', { reason: rankReasonText(r.rankReason, t) })}</p>
                </div>
                <span className="ms-row-actions">
                  <button type="button" className="ms-chip-btn" onClick={() => setLayout((l) => moveWidget(l, visibleIds, r.id, -1))} disabled={i === 0} aria-label={t('settings.moveUp', { name })}><i className="fa-solid fa-arrow-up" aria-hidden="true"></i></button>
                  <button type="button" className="ms-chip-btn" onClick={() => setLayout((l) => moveWidget(l, visibleIds, r.id, 1))} disabled={i === ranked.length - 1} aria-label={t('settings.moveDown', { name })}><i className="fa-solid fa-arrow-down" aria-hidden="true"></i></button>
                  <button type="button" className="ms-chip-btn" aria-pressed={pinned} onClick={() => setLayout((l) => togglePin(l, r.id))}>{t('settings.layout.pin')}</button>
                  <button type="button" className="ms-chip-btn" onClick={() => setLayout((l) => toggleHide(l, r.id))}>{t('settings.layout.hide')}</button>
                </span>
              </li>
            );
          })}
        </ol>
        {layout.hidden.length ? (
          <>
            <h3>{t('settings.layout.hidden')}</h3>
            <ul className="ms-list ms-list--plain">
              {layout.hidden.filter((id) => WIDGETS.some((w) => w.id === id)).map((id) => (
                <li key={id} className="ms-row">
                  <span>{t(`widgets.${id}.title`)}</span>
                  <button type="button" className="ms-chip-btn" onClick={() => setLayout((l) => toggleHide(l, id))}>{t('settings.layout.show')}</button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <button type="button" className="ms-btn ms-btn--secondary" onClick={() => setLayout(resetLayout())}>{t('settings.layout.reset')}</button>
      </Section>

      <Section id="notifications" title={t('settings.sections.notifications')}>
        <Switch checked={notify.official} onChange={(v) => setNotify((n) => ({ ...n, official: v }))} label={t('settings.notify.official')} />
        <Switch checked={notify.yellow} onChange={(v) => setNotify((n) => ({ ...n, yellow: v }))} label={t('settings.notify.yellow')} />
        <Switch checked={shownNotify.rainHour} onChange={(v) => setNotify((n) => ({ ...n, rainHour: v }))} label={t('settings.notify.rain')} />
        <Switch checked={shownNotify.lightning} onChange={(v) => setNotify((n) => ({ ...n, lightning: v }))} label={t('settings.notify.lightning')} />
        <Switch checked={notify.morning} onChange={(v) => setNotify((n) => ({ ...n, morning: v }))} label={t('settings.notify.morning')} />
        <div className="ms-row-fields">
          <label className="ms-field"><span>{t('settings.notify.quietFrom')}</span><input type="time" value={notify.quietFrom} onChange={(e) => setNotify((n) => ({ ...n, quietFrom: e.target.value }))} /></label>
          <label className="ms-field"><span>{t('settings.notify.quietTo')}</span><input type="time" value={notify.quietTo} onChange={(e) => setNotify((n) => ({ ...n, quietTo: e.target.value }))} /></label>
        </div>
        <p className="ms-muted">{t('settings.notify.help')}</p>
        <button type="button" className="ms-btn ms-btn--secondary" onClick={testAlert}>{t('settings.notify.test')}</button>
      </Section>

      <Section id="language" title={t('settings.sections.language')}>
        <ChipGroup label={t('topbar.language')} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} value={language} onChange={setLanguage} />
        <p className="ms-muted">{t('settings.language.more')}</p>
        <label className="ms-field">
          <span>{t('topbar.speechRate')}</span>
          <select value={a11y.speechRate} onChange={(e) => a11y.set({ speechRate: Number(e.target.value) })}>
            <option value={0.8}>{t('topbar.rateSlow')}</option>
            <option value={1}>{t('topbar.rateNormal')}</option>
            <option value={1.2}>{t('topbar.rateFast')}</option>
          </select>
        </label>
      </Section>

      <Section id="accessibility" title={t('settings.sections.accessibility')}>
        <ChipGroup label={t('topbar.textSize')} options={TEXT_SCALES.map((s) => ({ value: s, label: `${s}%` }))} value={a11y.textScale} onChange={(v) => a11y.set({ textScale: v })} />
        <Switch checked={a11y.contrast} onChange={(v) => a11y.set({ contrast: v })} label={t('topbar.contrast')} />
        <Switch checked={a11y.simple} onChange={(v) => a11y.set({ simple: v })} label={t('topbar.simpleView')} />
        <Switch checked={a11y.reduceMotion} onChange={(v) => a11y.set({ reduceMotion: v })} label={t('topbar.reduceMotion')} />
        <Switch checked={a11y.lite} onChange={(v) => a11y.set({ lite: v })} label={t('topbar.liteMode')} />
      </Section>

      <Section id="data" title={t('settings.sections.data')}>
        <p>{t('settings.data.intro')}</p>
        <ul className="ms-list">
          {[...new Set((hydrated ? listMausamKeys() : []).map((k) => keyLabel(k, t)))].map((label) => <li key={label}>{label}</li>)}
        </ul>
        <p className="ms-actions">
          <button type="button" className="ms-btn ms-btn--secondary" onClick={exportData}><i className="fa-solid fa-download" aria-hidden="true"></i> {t('settings.data.export')}</button>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => setMessage(t('settings.data.oldCleared', { count: clearKeys('swasth.') }))}>{t('settings.data.clearOld')}</button>
        </p>
        {confirmDelete ? (
          <div role="alertdialog" aria-labelledby="del-q" className="ms-confirm">
            <p id="del-q">{t('settings.data.confirm')}</p>
            <p className="ms-actions">
              <button type="button" className="ms-btn ms-btn--danger" onClick={deleteAll}>{t('settings.data.confirmYes')}</button>
              <button type="button" className="ms-btn ms-btn--secondary" onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</button>
            </p>
          </div>
        ) : (
          <button type="button" className="ms-btn ms-btn--danger" onClick={() => setConfirmDelete(true)}>{t('settings.data.delete')}</button>
        )}
        <p><Link href="/policies">{t('settings.data.privacy')}</Link></p>
      </Section>

      {DEMO_MODE ? (
        <Section id="demo" title={t('demo.scenarios')}>
          <p className="ms-muted">{t('settings.demo.help')}</p>
          <ul className="ms-list ms-list--plain">
            {SCENARIO_IDS.map((id) => (
              <li key={id} className="ms-row">
                <span>{t(`demo.${id}`)}</span>
                <button type="button" className="ms-chip-btn" aria-pressed={weather.demo === id} onClick={() => weather.setDemo(id)}>{t('settings.demo.load')}</button>
              </li>
            ))}
          </ul>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => weather.setDemo(null)} disabled={!weather.demo}>{t('demo.backToLive')}</button>
        </Section>
      ) : null}

      <Section id="account" title={t('settings.sections.account')}>
        <p>{t('settings.account.note')}</p>
        {isLoggedIN ? (
          <button type="button" className="ms-btn ms-btn--secondary" onClick={LogoutUser}>{t('nav.logout')}</button>
        ) : (
          <Link href="/login" className="ms-btn ms-btn--secondary">{t('settings.account.signIn')}</Link>
        )}
      </Section>

      <Section id="about" title={t('settings.sections.about')}>
        <p>{t('settings.about.version', { version: '0.2.0' })}</p>
        <p>{t('footer.dataAttribution')}</p>
        <p><Link href="/about">{t('footer.about')}</Link></p>
      </Section>
    </>
  );
}
