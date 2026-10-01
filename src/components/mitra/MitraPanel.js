"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

// The dialog (lexicon, reply engine, voice) loads on first open, keeping it
// out of every page's first load (PRD 13.8).
const MitraDialog = dynamic(() => import('./MitraDialog'), { ssr: false });

/** Floating "Ask Mausam Mitra" button (PRD 10.10). */
export default function MitraPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <button
        type="button"
        className="ms-mitra-fab"
        aria-haspopup="dialog"
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        onPointerEnter={() => setLoaded(true)}
        onFocus={() => setLoaded(true)}
      >
        <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
        <span className="ms-mitra-fab-label">{t('mitra.open')}</span>
      </button>
      {loaded ? <MitraDialog open={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
