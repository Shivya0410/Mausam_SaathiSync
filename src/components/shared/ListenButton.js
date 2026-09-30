"use client";

import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { speak, speechSupported } from '../../lib/speech';
import { useA11y } from '../../lib/context/A11yProvider';

const noop = () => () => {};

/** Reads `text` aloud in `lang` (defaults to the UI language). Hidden when speech is unsupported. */
export default function ListenButton({ text, lang, label, compact = false, className = '' }) {
  const { t, i18n } = useTranslation();
  const { speechRate } = useA11y();
  const supported = useSyncExternalStore(noop, speechSupported, () => false);
  if (!supported || !text) return null;
  const say = typeof text === 'function' ? text : () => text;
  const name = label || t('common.listen');
  return (
    <button
      type="button"
      className={`ms-chip-btn ${className}`}
      onClick={() => speak(say(), { lang: lang || i18n.language, rate: speechRate })}
      aria-label={compact ? name : undefined}
    >
      <i className="fa-solid fa-volume-high" aria-hidden="true"></i>
      {compact ? null : <span>{name}</span>}
    </button>
  );
}
