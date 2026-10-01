"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import Tabs from '../shared/Tabs';
import CameraCapture from './CameraCapture';
import LevelBadge from '../shared/LevelBadge';
import { PhotoThumb, ConfidenceLine, PrivacyPoints, ModelMissing, ModelFailed, WhereStep, useModelState } from './parts';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { classifier } from '../../lib/cv/classifier';
import { floodDecision } from '../../lib/cv/decide';
import { hazeScore, fogReportLabel } from '../../lib/cv/darkChannel';
import { imageDataAt } from '../../lib/cv/image';
import { submitReport } from '../../lib/reportsClient';
import { levelName } from '../../lib/mausam/hazards';
import { fmtVisibility } from '../../lib/format';

const flood = () => classifier('jal-bharav');
const DHUNDH_VERSION = 'dhundh-dcp-0.1';
const SEVERITY_ICONS = ['fa-shoe-prints', 'fa-person-walking', 'fa-person', 'fa-motorcycle'];

function useSubmit() {
  const { t } = useTranslation();
  const weather = useWeather();
  const [state, setState] = useState({ status: 'idle', error: null, report: null });
  const send = async (payload, where) => {
    setState({ status: 'sending', error: null, report: null });
    try {
      const loc = where || weather.place;
      const report = await submitReport({
        ...payload,
        lat: loc.lat,
        lon: loc.lon,
        ...(where?.accuracyM ? { accuracyM: where.accuracyM } : {}),
        observedAt: new Date().toISOString(),
      });
      setState({ status: 'done', error: null, report });
      weather.reports.refresh();
    } catch (e) {
      setState({ status: 'idle', error: e.code === 'rate_limited' ? t('cv.errors.rateLimited') : t('cv.errors.shareFailed'), report: null });
    }
  };
  return [state, send, () => setState({ status: 'idle', error: null, report: null })];
}

/** Jal-Bharav Watch (PRD 11.2, 18.8). */
function WaterFlow() {
  const { t, i18n } = useTranslation();
  const weather = useWeather();
  const [, setStats] = useStore(stores.cvStats);
  const [model, retryModel] = useModelState(flood);
  const [step, setStep] = useState('intro');
  const [canvas, setCanvas] = useState(null);
  const [check, setCheck] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [where, setWhere] = useState(null);
  const [sub, send, resetSub] = useSubmit();


  const reset = () => {
    setCanvas(null);
    setCheck(null);
    setSeverity(null);
    resetSub();
    setStep('intro');
  };

  const onCapture = async (c) => {
    setCanvas(c);
    if (model === 'missing') {
      setCheck({ status: 'manual' });
      setStep('check');
      return;
    }
    setStep('analysing');
    try {
      const { probs, version, ms } = await flood().classify(c);
      setCheck({ ...floodDecision(probs), version, ms });
    } catch {
      setCheck({ status: 'manual' });
    }
    setStep('check');
  };

  const submit = async () => {
    const manual = check.status === 'manual';
    await send(
      {
        type: 'waterlogging',
        label: 'flooded_street',
        severity,
        ...(manual ? {} : { confidence: Math.round(check.p * 100) / 100 }),
        modelVersion: manual ? 'manual' : check.version,
        lang: i18n.language === 'hi' ? 'hi' : 'en',
      },
      where,
    );
    setStats((s) => ({ ...s, waterReports: (s.waterReports || 0) + 1 }));
  };

  if (sub.status === 'done') {
    return (
      <section className="ms-card" aria-labelledby="w-done" role="status">
        <h2 id="w-done">
          <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('cv.water.doneTitle')}
        </h2>
        <p>{t('cv.water.doneBody')}</p>
        <p>
          {t('cv.water.statusLine', { status: t(`reportStatus.${sub.report.status}`), count: sub.report.confirmations || 0 })}
        </p>
        <p className="ms-actions">
          <Link href="/reports" className="ms-btn">{t('reports.seeReports')}</Link>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={reset}>{t('cv.water.another')}</button>
        </p>
      </section>
    );
  }

  return (
    <>
      {step === 'intro' ? (
        <section className="ms-card" aria-labelledby="w-intro">
          <h2 id="w-intro">{t('cv.water.introTitle')}</h2>
          <p>{t('cv.water.introBody')}</p>
          <PrivacyPoints keys={['cv.privacy.checkedHere', 'cv.privacy.onlyResult']} />
          {model === 'missing' ? <ModelMissing nameKey="cv.models.water" /> : null}
          {model === 'failed' ? <ModelFailed onRetry={retryModel} /> : null}
          <CameraCapture onCapture={onCapture} hintKey="cv.water.aim" />
        </section>
      ) : null}

      {step === 'analysing' ? (
        <section className="ms-card" aria-busy="true">
          <PhotoThumb canvas={canvas} alt={t('cv.yourPhoto')} />
          <p role="status">{t('cv.status.checking')}</p>
        </section>
      ) : null}

      {step === 'check' && check ? (
        <section className="ms-card" aria-labelledby="w-check">
          <PhotoThumb canvas={canvas} alt={t('cv.yourPhoto')} />
          {check.status === 'reject' ? (
            <>
              <h2 id="w-check">{t('cv.water.notFlooded')}</h2>
              <p className="ms-muted">{t('cv.water.notFloodedHelp')}</p>
              <p className="ms-actions">
                <button type="button" className="ms-btn" onClick={reset}>{t('cv.again')}</button>
              </p>
            </>
          ) : check.status === 'manual' ? (
            <>
              <h2 id="w-check">{t('cv.water.manualQuestion')}</h2>
              <p className="ms-muted">{t('cv.water.manualHelp')}</p>
              <p className="ms-actions">
                <button type="button" className="ms-btn" onClick={() => setStep('depth')}>{t('cv.water.manualYes')}</button>
                <button type="button" className="ms-btn ms-btn--secondary" onClick={reset}>{t('cv.water.manualNo')}</button>
              </p>
            </>
          ) : (
            <>
              <h2 id="w-check">{t('cv.water.looksFlooded')}</h2>
              <ConfidenceLine p={check.p} />
              {check.status === 'unverified' ? <p className="ms-muted">{t('cv.water.unverifiedNote')}</p> : null}
              {check.ms != null ? <p className="ms-muted">{t('cv.checkedIn', { ms: check.ms })}</p> : null}
              <p className="ms-actions">
                <button type="button" className="ms-btn" onClick={() => setStep('depth')}>{t('common.next')}</button>
                <button type="button" className="ms-btn ms-btn--secondary" onClick={reset}>{t('cv.again')}</button>
              </p>
            </>
          )}
        </section>
      ) : null}

      {step === 'depth' ? (
        <section className="ms-card" aria-labelledby="w-depth">
          <h2 id="w-depth">{t('cv.water.howDeep')}</h2>
          <div
            className="ms-depth"
            role="radiogroup"
            aria-labelledby="w-depth"
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              const next = (((severity || (d > 0 ? 0 : 1)) - 1 + d + 4) % 4) + 1;
              setSeverity(next);
              e.currentTarget.querySelector(`[data-sev="${next}"]`)?.focus();
            }}
          >
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                data-sev={s}
                aria-checked={severity === s}
                tabIndex={severity === s || (!severity && s === 1) ? 0 : -1}
                className="ms-depth-btn"
                onClick={() => setSeverity(s)}
              >
                <i className={`fa-solid ${SEVERITY_ICONS[s - 1]}`} aria-hidden="true"></i>
                <strong>{t(`severity.${s}`)}</strong>
                <span className="ms-muted">{t(`cv.water.depthHint.${s}`)}</span>
              </button>
            ))}
          </div>
          <WhereStep place={weather.place} value={where} onChange={setWhere} />
          <p className="ms-actions">
            <button type="button" className="ms-btn" onClick={submit} disabled={!severity || sub.status === 'sending'}>
              {sub.status === 'sending' ? t('cv.sending') : t('cv.water.submit')}
            </button>
            <button type="button" className="ms-btn ms-btn--secondary" onClick={reset}>{t('common.cancel')}</button>
          </p>
          {!severity ? <p className="ms-muted">{t('cv.water.pickDepth')}</p> : null}
          {sub.error ? <p className="ms-error" role="alert">{sub.error}</p> : null}
        </section>
      ) : null}
    </>
  );
}

/** Dhundh Meter (PRD 11.3): a haze estimate from one photo, beside the forecast. */
function FogFlow() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const weather = useWeather();
  const [, setStats] = useStore(stores.cvStats);
  const [canvas, setCanvas] = useState(null);
  const [res, setRes] = useState(null);
  const [where, setWhere] = useState(null);
  const [sub, send, resetSub] = useSubmit();

  const onCapture = (c) => {
    setCanvas(c);
    const t0 = performance.now();
    const r = hazeScore(imageDataAt(c, 320));
    setRes({ ...r, ms: Math.round(performance.now() - t0) });
    setStats((s) => ({ ...s, fogChecks: (s.fogChecks || 0) + 1 }));
  };
  const reset = () => {
    setCanvas(null);
    setRes(null);
    resetSub();
  };

  const snap = weather.snapshot;
  const visNow = snap?.current?.visibilityM ?? snap?.hourly?.[0]?.visibilityM;
  const fogWarn = (snap?.warnings || []).find((w) => w.hazard === 'dense_fog');

  if (!canvas || !res) {
    return (
      <section className="ms-card" aria-labelledby="f-intro">
        <h2 id="f-intro">{t('cv.fog.introTitle')}</h2>
        <p>{t('cv.fog.introBody')}</p>
        <PrivacyPoints keys={['cv.privacy.stays', 'cv.privacy.noModel']} />
        <CameraCapture onCapture={onCapture} hintKey="cv.fog.aim" />
      </section>
    );
  }

  return (
    <section className="ms-card ms-cv-result" aria-labelledby="f-result">
      <PhotoThumb canvas={canvas} alt={t('cv.yourPhoto')} />
      {res.tooDark ? (
        <>
          <h2 id="f-result">{t('cv.fog.tooDark')}</h2>
          <p>{visNow != null ? t('cv.fog.forecastVis', { vis: fmtVisibility(visNow, lang) }) : null}</p>
        </>
      ) : (
        <>
          <h2 id="f-result">{t(`cv.fog.bands.${res.band}.title`)}</h2>
          <p className="ms-muted">{t('cv.fog.estimateLabel', { score: Math.round(res.score * 100) })}</p>
          <p>{t(`cv.fog.bands.${res.band}.advice`)}</p>
          <div className="ms-cv-compare">
            <div>
              <h3>{t('cv.fog.yourPhoto')}</h3>
              <p>{t(`cv.fog.bands.${res.band}.visibility`)}</p>
            </div>
            <div>
              <h3>{t('cv.fog.forecast')}</h3>
              <p>{visNow != null ? fmtVisibility(visNow, lang) : t('common.notAvailableShort')}</p>
              {fogWarn ? (
                <p>
                  <LevelBadge level={levelName(fogWarn.level)} /> {t('hazards.dense_fog')}
                </p>
              ) : null}
            </div>
          </div>
          <p className="ms-muted">{t('cv.fog.provisional')}</p>
          {res.band !== 'clear' ? (
            <>
              <WhereStep place={weather.place} value={where} onChange={setWhere} />
              {sub.status === 'done' ? (
                <p role="status">
                  <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('cv.shared')} <Link href="/reports">{t('reports.seeReports')}</Link>
                </p>
              ) : (
                <button
                  type="button"
                  className="ms-btn"
                  disabled={sub.status === 'sending'}
                  onClick={() => send({ type: 'fog', label: fogReportLabel(res.band), modelVersion: DHUNDH_VERSION, lang: lang === 'hi' ? 'hi' : 'en' }, where)}
                >
                  <i className="fa-solid fa-share-nodes" aria-hidden="true"></i> {t('cv.fog.share')}
                </button>
              )}
              {sub.error ? <p className="ms-error" role="alert">{sub.error}</p> : null}
            </>
          ) : null}
        </>
      )}
      <p className="ms-muted">{t('cv.checkedIn', { ms: res.ms })}</p>
      <p className="ms-actions">
        <button type="button" className="ms-btn ms-btn--secondary" onClick={reset}>{t('cv.again')}</button>
      </p>
    </section>
  );
}

/** /report: Jal-Bharav Watch and Dhundh Meter (PRD 4.1). */
export default function ReportPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('water');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).get('type') === 'fog') setTab('fog');
  }, []);
  return (
    <>
      <PageHeader title={t('pages.report.title')} subtitle={t('pages.report.subtitle')} />
      <Tabs
        label={t('pages.report.title')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'water', label: t('cv.tabs.water') },
          { id: 'fog', label: t('cv.tabs.fog') },
        ]}
      >
        {(active) => (active === 'water' ? <WaterFlow /> : <FogFlow />)}
      </Tabs>
    </>
  );
}
