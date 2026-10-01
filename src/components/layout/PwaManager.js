"use client";

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';

/**
 * Service worker registration, the "new version" toast and the install
 * card (PRD 13.7). Registered only in production builds so it never
 * caches over development changes.
 */
export default function PwaManager() {
  const { t } = useTranslation();
  const [pwa, setPwa] = useStore(stores.pwa);
  const [waiting, setWaiting] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return undefined;
    let cancelled = false;
    const register = () =>
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        if (cancelled) return;
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw?.addEventListener('statechange', () => {
            if (sw.state === 'installed') {
              // First install: take over at once. Updates: ask the user.
              if (navigator.serviceWorker.controller) setWaiting(sw);
              else sw.postMessage('skipWaiting');
            }
          });
        });
      }).catch(() => {});
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    // Reload only when an existing worker is replaced (the user tapped
    // "Reload"); the first install takes control silently.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloaded = false;
    const onChange = () => {
      if (hadController && !reloaded) {
        reloaded = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
    };
  }, []);

  // Count visit days; the install card needs a second day.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setPwa((p) => (p.visitDays.includes(today) ? p : { ...p, visitDays: [...p.visitDays, today].slice(-5) }));
  }, [setPwa]);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      promptRef.current = e;
      setCanInstall(true);
    };
    const onInstalled = () => setCanInstall(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    const e = promptRef.current;
    if (!e) return;
    e.prompt();
    await e.userChoice.catch(() => null);
    promptRef.current = null;
    setCanInstall(false);
  };

  const showInstall = canInstall && !pwa.dismissed && pwa.visitDays.length >= 2;
  if (!waiting && !showInstall) return null;
  return (
    <div className="ms-toasts" role="region" aria-label={t('pwa.region')}>
      {waiting ? (
        <div className="ms-toast" role="status">
          <span>{t('pwa.update')}</span>
          <button type="button" className="ms-btn" onClick={() => waiting.postMessage('skipWaiting')}>{t('pwa.reload')}</button>
          <button type="button" className="ms-icon-btn" aria-label={t('common.dismiss')} onClick={() => setWaiting(null)}>
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      ) : null}
      {showInstall ? (
        <div className="ms-toast" role="status">
          <img src="/icons/icon-192.png" alt="" width={36} height={36} />
          <span>{t('pwa.installText')}</span>
          <button type="button" className="ms-btn" onClick={install}>{t('pwa.install')}</button>
          <button type="button" className="ms-icon-btn" aria-label={t('common.dismiss')} onClick={() => setPwa((p) => ({ ...p, dismissed: true }))}>
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      ) : null}
    </div>
  );
}
