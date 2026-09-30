"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '../shared/Dialog';
import { useA11y, TEXT_SCALES } from '../../lib/context/A11yProvider';
import { speak, stopSpeaking, speechSupported } from '../../lib/speech';

const LABELS = { 90: 'A−', 100: 'A', 125: 'A+', 150: 'A++', 200: 'A+++' };

function Switch({ checked, onChange, label, hint }) {
  return (
    <div className="ms-switch-row">
      <button type="button" role="switch" aria-checked={checked} className="ms-switch" onClick={() => onChange(!checked)}>
        <span className="ms-switch-track" aria-hidden="true"><span className="ms-switch-thumb"></span></span>
        <span>{label}</span>
      </button>
      {hint ? <p className="ms-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Accessibility tools (PRD 5.3, 20.14; GIGW G4, G5): text size up to 200%,
 * high contrast, simple view, reduce motion, lite mode, read page aloud,
 * speech rate. Settings persist on this device (mausam.a11y.v1).
 */
export default function A11yMenu() {
  const { t, i18n } = useTranslation();
  const a = useA11y();
  const [open, setOpen] = useState(false);
  const readPage = () => {
    const main = document.getElementById('main');
    if (main) speak(main.innerText.slice(0, 4000), { lang: i18n.language, rate: a.speechRate });
  };
  return (
    <>
      <button type="button" className="ms-icon-btn ms-aa" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <span aria-hidden="true">Aa</span>
        <span className="visually-hidden">{t('topbar.accessibility')}</span>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('topbar.accessibility')}>
        <fieldset className="ms-fieldset">
          <legend>{t('topbar.textSize')}</legend>
          <div className="ms-seg" role="radiogroup" aria-label={t('topbar.textSize')}>
            {TEXT_SCALES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={a.textScale === s}
                className="ms-seg-btn"
                onClick={() => a.set({ textScale: s })}
                aria-label={t('topbar.textSizeValue', { value: s })}
              >
                <span aria-hidden="true">{LABELS[s]}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <Switch checked={a.contrast} onChange={(v) => a.set({ contrast: v })} label={t('topbar.contrast')} />
        <Switch checked={a.simple} onChange={(v) => a.set({ simple: v })} label={t('topbar.simpleView')} hint={t('topbar.simpleViewHint')} />
        <Switch checked={a.reduceMotion} onChange={(v) => a.set({ reduceMotion: v })} label={t('topbar.reduceMotion')} />
        <Switch
          checked={a.lite}
          onChange={(v) => a.set({ lite: v })}
          label={t('topbar.liteMode')}
          hint={a.liteAuto ? t('topbar.liteAuto') : t('topbar.liteHint')}
        />
        {speechSupported() ? (
          <>
            <p className="ms-actions">
              <button type="button" className="ms-btn ms-btn--secondary" onClick={readPage}>
                <i className="fa-solid fa-volume-high" aria-hidden="true"></i> {t('topbar.readPage')}
              </button>
              <button type="button" className="ms-btn ms-btn--secondary" onClick={stopSpeaking}>
                <i className="fa-solid fa-stop" aria-hidden="true"></i> {t('topbar.stopReading')}
              </button>
            </p>
            <label className="ms-field">
              <span>{t('topbar.speechRate')}</span>
              <select value={a.speechRate} onChange={(e) => a.set({ speechRate: Number(e.target.value) })}>
                <option value={0.8}>{t('topbar.rateSlow')}</option>
                <option value={1}>{t('topbar.rateNormal')}</option>
                <option value={1.2}>{t('topbar.rateFast')}</option>
              </select>
            </label>
          </>
        ) : (
          <p className="ms-muted">{t('topbar.noSpeech')}</p>
        )}
      </Dialog>
    </>
  );
}
