"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../../lib/hooks/useGeolocation';
import { confidenceWord } from '../../lib/cv/decide';

/** Thumbnail of the captured photo. The object URL is revoked on unmount (PRD 11.4). */
export function PhotoThumb({ canvas, alt }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let revoke = null;
    let live = true;
    canvas.toBlob(
      (blob) => {
        if (!live || !blob) return;
        revoke = URL.createObjectURL(blob);
        setUrl(revoke);
      },
      'image/jpeg',
      0.8,
    );
    return () => {
      live = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [canvas]);
  return url ? (
    <img src={url} alt={alt} className="ms-cv-thumb" />
  ) : (
    <div className="ms-cv-thumb ms-skeleton" aria-hidden="true"></div>
  );
}

/** "Very likely (87%)" (PRD 20.11). */
export function ConfidenceLine({ p }) {
  const { t } = useTranslation();
  const pct = Math.round(p * 100);
  return (
    <p className="ms-cv-conf">
      <strong>{t(`cv.conf.${confidenceWord(p)}`)}</strong> ({pct}%)
    </p>
  );
}

/** The on-device privacy promise, above every camera button (PRD 11.4). */
export function PrivacyPoints({ keys }) {
  const { t } = useTranslation();
  return (
    <ul className="ms-cv-points">
      {keys.map((k) => (
        <li key={k}>
          <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t(k)}
        </li>
      ))}
    </ul>
  );
}

/** Honest notice when the model files are not on this server. */
export function ModelMissing({ nameKey }) {
  const { t } = useTranslation();
  return (
    <div className="ms-card ms-unknown" role="status">
      <p>
        <strong>{t('cv.modelMissing.title', { name: t(nameKey) })}</strong>
      </p>
      <p>{t('cv.modelMissing.body')}</p>
      <p>
        <Link href="/about#models">{t('cv.modelCard')}</Link>
      </p>
    </div>
  );
}

/**
 * "Where?" (PRD 18.8 screen 4): the current place by default, or the
 * phone's location if the user asks. The server snaps it to ~500 m.
 */
export function WhereStep({ place, value, onChange }) {
  const { t } = useTranslation();
  const geo = useGeolocation();
  const useGps = async () => {
    const c = await geo.request();
    if (c) onChange({ lat: c.lat, lon: c.lon, accuracyM: Math.round(c.accuracyM), label: t('cv.where.myLocation') });
  };
  const label = value?.label || place.name;
  return (
    <fieldset className="ms-fieldset">
      <legend>{t('cv.where.title')}</legend>
      <p>
        <i className="fa-solid fa-location-dot" aria-hidden="true"></i> {t('cv.where.near', { place: label })}
      </p>
      <p className="ms-actions">
        <button type="button" className="ms-chip-btn" onClick={useGps} disabled={geo.status === 'loading'}>
          {geo.status === 'loading' ? t('places.locating') : t('cv.where.useGps')}
        </button>
        {value ? (
          <button type="button" className="ms-chip-btn" onClick={() => onChange(null)}>
            {t('cv.where.usePlace', { place: place.name })}
          </button>
        ) : null}
      </p>
      {geo.status === 'error' ? <p className="ms-error" role="alert">{t(geo.error === 'denied' ? 'errors.locationDenied' : 'places.locationUnavailable')}</p> : null}
      <p className="ms-muted">{t('cv.where.note')}</p>
    </fieldset>
  );
}

/**
 * Model warm-up state: 'loading' | 'ready' | 'missing' | 'failed', with a
 * retry for a failed download (PRD edge case E16). Other features keep
 * working while a model is unavailable.
 */
export function useModelState(getClassifier) {
  const [state, setState] = useState('loading');
  const load = useCallback(() => {
    let live = true;
    getClassifier()
      .warmUp()
      .then(() => live && setState('ready'))
      .catch((e) => live && setState(e.code === 'not_installed' ? 'missing' : 'failed'));
    return () => {
      live = false;
    };
  }, [getClassifier]);
  useEffect(() => load(), [load]);
  const retry = () => {
    setState('loading');
    load();
  };
  return [state, retry];
}

/** "Couldn't load the AI model" with a retry (E16). */
export function ModelFailed({ onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="ms-card ms-unknown" role="alert">
      <p>{t('cv.modelFailed')}</p>
      <button type="button" className="ms-btn ms-btn--secondary" onClick={onRetry}>{t('common.retry')}</button>
    </div>
  );
}
