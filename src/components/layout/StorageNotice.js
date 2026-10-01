"use client";

import { useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { storageBlocked, STORAGE_BLOCKED_EVENT } from '../../lib/stores/deviceStore';

const subscribe = (cb) => {
  window.addEventListener(STORAGE_BLOCKED_EVENT, cb);
  return () => window.removeEventListener(STORAGE_BLOCKED_EVENT, cb);
};

/** One-time notice when settings cannot be saved (PRD edge case E19). */
export default function StorageNotice() {
  const { t } = useTranslation();
  const blocked = useSyncExternalStore(subscribe, storageBlocked, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!blocked || dismissed) return null;
  return (
    <div className="ms-toasts" role="region" aria-label={t('pwa.region')}>
      <div className="ms-toast" role="status">
        <span>{t('common.storageBlocked')}</span>
        <button type="button" className="ms-icon-btn" aria-label={t('common.dismiss')} onClick={() => setDismissed(true)}>
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
