"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import CameraCapture from './CameraCapture';
import ListenButton from '../shared/ListenButton';
import LevelBadge from '../shared/LevelBadge';
import { PhotoThumb, ConfidenceLine, PrivacyPoints, ModelMissing, WhereStep } from './parts';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useStore } from '../../lib/hooks/useStore';
import { useNow } from '../../lib/hooks/useNow';
import { stores } from '../../lib/stores';
import { classifier } from '../../lib/cv/classifier';
import { skyDecision, stormContext } from '../../lib/cv/decide';
import { submitReport } from '../../lib/reportsClient';
import { sliceHours } from '../../lib/mausam/time';
import { levelName } from '../../lib/mausam/hazards';
import { fmtTime } from '../../lib/format';
import { CLOUD_TYPES } from '../../data/cloudTypes';

const sky = () => classifier('sky-snap');

/** Sky Snap (PRD 11.1, 18.7): what the clouds are and what they usually mean. */
export default function SkySnap() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const weather = useWeather();
  const now = useNow();
  const [, setStats] = useStore(stores.cvStats);
  const [step, setStep] = useState('intro');
  const [canvas, setCanvas] = useState(null);
  const [model, setModel] = useState('loading');
  const [result, setResult] = useState(null);
  const [where, setWhere] = useState(null);
  const [share, setShare] = useState({ status: 'idle', error: null });

  // Warm the model on mount (PRD 20.10); a missing model is not an error.
  useEffect(() => {
    let live = true;
    sky()
      .warmUp()
      .then(() => live && setModel('ready'))
      .catch((e) => live && setModel(e.code === 'not_installed' ? 'missing' : 'failed'));
    return () => {
      live = false;
    };
  }, []);

  const onCapture = async (c) => {
    setCanvas(c);
    setShare({ status: 'idle', error: null });
    if (model === 'missing') {
      setStep('manual');
      return;
    }
    setStep('analysing');
    try {
      const { probs, version, ms } = await sky().classify(c);
      setResult({ ...skyDecision(probs), version, ms, manual: false });
      setStats((s) => ({ ...s, skySnaps: (s.skySnaps || 0) + 1 }));
      setStep('result');
    } catch {
      setStep('manual');
    }
  };

  const pickManual = (code) => {
    setResult({ status: 'ok', label: code, p: null, alt: null, top: [], version: 'manual', manual: true });
    setStats((s) => ({ ...s, skySnaps: (s.skySnaps || 0) + 1 }));
    setStep('result');
  };

  const reset = () => {
    setCanvas(null);
    setResult(null);
    setStep('intro');
  };

  const snap = weather.snapshot;
  const context = useMemo(() => {
    if (!snap || !now) return null;
    return stormContext(sliceHours(snap.hourly, now, 6), snap.warnings);
  }, [snap, now]);

  const cloud = result?.label ? CLOUD_TYPES.find((c) => c.code === result.label) : null;
  const forecastLine = context
    ? context.stormAt
      ? t('cv.sky.forecastStorm', { time: fmtTime(context.stormAt, lang) })
      : t('cv.sky.forecastNoStorm')
    : null;
  const stormMismatch = cloud?.storm && context && !context.stormAt && !context.nowcast;
  const speech = cloud
    ? [t(`cloudTypes.${cloud.code}.name`), t(`cloudTypes.${cloud.code}.means`), forecastLine, t(`cloudTypes.${cloud.code}.safety`)].filter(Boolean).join('. ')
    : '';

  const doShare = async () => {
    setShare({ status: 'sending', error: null });
    try {
      const loc = where || weather.place;
      await submitReport({
        type: 'sky',
        label: result.label,
        ...(result.manual ? {} : { confidence: Math.round(result.p * 100) / 100 }),
        lat: loc.lat,
        lon: loc.lon,
        ...(where?.accuracyM ? { accuracyM: where.accuracyM } : {}),
        observedAt: new Date().toISOString(),
        modelVersion: result.version,
        lang: lang === 'hi' ? 'hi' : 'en',
      });
      setShare({ status: 'done', error: null });
      weather.reports.refresh();
    } catch (e) {
      setShare({ status: 'idle', error: e.code === 'rate_limited' ? t('cv.errors.rateLimited') : t('cv.errors.shareFailed') });
    }
  };

  return (
    <>
      <PageHeader title={t('pages.skySnap.title')} subtitle={t('pages.skySnap.subtitle')} />

      {step === 'intro' ? (
        <section className="ms-card" aria-labelledby="ss-intro">
          <h2 id="ss-intro">{t('cv.sky.introTitle')}</h2>
          <PrivacyPoints keys={['cv.privacy.stays', 'cv.privacy.noPeople']} />
          <p>{t('cv.sky.goodPhoto')}</p>
          {model === 'missing' ? <ModelMissing nameKey="cv.models.sky" /> : null}
          <CameraCapture onCapture={onCapture} hintKey="cv.sky.aim" />
        </section>
      ) : null}

      {step === 'analysing' ? (
        <section className="ms-card" aria-busy="true">
          <PhotoThumb canvas={canvas} alt={t('cv.yourPhoto')} />
          <p role="status">{t('cv.status.checking')}</p>
        </section>
      ) : null}

      {step === 'manual' ? (
        <section className="ms-card" aria-labelledby="ss-manual">
          <PhotoThumb canvas={canvas} alt={t('cv.yourPhoto')} />
          <h2 id="ss-manual">{t('cv.sky.manualTitle')}</h2>
          <p className="ms-muted">{t('cv.sky.manualHelp')}</p>
          <ul className="ms-cloud-list">
            {CLOUD_TYPES.map((c) => (
              <li key={c.code}>
                <button type="button" className="ms-cloud-btn" onClick={() => pickManual(c.code)}>
                  <strong>{t(`cloudTypes.${c.code}.name`)}</strong>
                  <span>{t(`cloudTypes.${c.code}.means`)}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={reset}>{t('cv.again')}</button>
        </section>
      ) : null}

      {step === 'result' && result ? (
        <section className="ms-card ms-cv-result" aria-labelledby="ss-result">
          <PhotoThumb canvas={canvas} alt={t('cv.yourPhoto')} />
          {result.status === 'ok' && cloud ? (
            <>
              <h2 id="ss-result">{t(`cloudTypes.${cloud.code}.name`)}</h2>
              {result.manual ? <p className="ms-muted">{t('cv.manualLabel')}</p> : <ConfidenceLine p={result.p} />}
              {result.alt ? <p className="ms-muted">{t('cv.sky.couldBe', { a: t(`cloudTypes.${cloud.code}.name`), b: t(`cloudTypes.${result.alt.label}.name`) })}</p> : null}
              <p>{t(`cloudTypes.${cloud.code}.means`)}</p>
              <div className="ms-cv-compare">
                <div>
                  <h3>{t('cv.sky.yourSky')}</h3>
                  <p>{t(`cloudTypes.${cloud.code}.name`)}</p>
                </div>
                <div>
                  <h3>{t('cv.sky.forecastSays')}</h3>
                  <p>{forecastLine || t('common.notAvailableShort')}</p>
                  {context?.nowcast ? (
                    <p>
                      <LevelBadge level={levelName(context.nowcast.level)} /> {t('cv.sky.imdNowcast')}
                    </p>
                  ) : null}
                </div>
              </div>
              {stormMismatch ? <p className="ms-callout">{t('cv.sky.mismatch')}</p> : null}
              <p className={cloud.storm ? 'ms-callout ms-callout--danger' : 'ms-callout'}>
                <i className="fa-solid fa-circle-arrow-right" aria-hidden="true"></i> {t(`cloudTypes.${cloud.code}.safety`)}
              </p>
              <ListenButton text={speech} />
              <WhereStep place={weather.place} value={where} onChange={setWhere} />
              <p className="ms-actions">
                {share.status === 'done' ? (
                  <span role="status">
                    <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('cv.shared')} <Link href="/reports">{t('reports.seeReports')}</Link>
                  </span>
                ) : (
                  <button type="button" className="ms-btn" onClick={doShare} disabled={share.status === 'sending'}>
                    <i className="fa-solid fa-share-nodes" aria-hidden="true"></i> {t('cv.sky.share')}
                  </button>
                )}
                <button type="button" className="ms-btn ms-btn--secondary" onClick={reset}>{t('cv.again')}</button>
              </p>
              {share.error ? <p className="ms-error" role="alert">{share.error}</p> : null}
              <p className="ms-muted">{t('cv.sky.shareNote')}</p>
            </>
          ) : (
            <>
              <h2 id="ss-result">{result.status === 'notSky' ? t('cv.sky.notSky') : t('cv.sky.unsure')}</h2>
              {result.top?.length ? (
                <p className="ms-muted">
                  {t('cv.guesses')}: {result.top.filter((x) => x.label !== 'none').map((x) => `${t(`cloudTypes.${x.label}.name`)} ${Math.round(x.p * 100)}%`).join(', ')}
                </p>
              ) : null}
              <p className="ms-actions">
                <button type="button" className="ms-btn" onClick={reset}>{t('cv.again')}</button>
                <button type="button" className="ms-btn ms-btn--secondary" onClick={() => setStep('manual')}>{t('cv.pickMyself')}</button>
              </p>
            </>
          )}
          {!result.manual && result.ms != null ? <p className="ms-muted">{t('cv.checkedIn', { ms: result.ms })}</p> : null}
          <p>
            <Link href="/about#models">{t('cv.modelCard')}</Link>
          </p>
        </section>
      ) : null}
    </>
  );
}
