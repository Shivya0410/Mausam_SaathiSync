"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

const noop = () => () => {};
const recogniser = () => (typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null);
const supported = () => Boolean(recogniser());

/**
 * Speech to text with the Web Speech API (PRD 10.9): hi-IN or en-IN by UI
 * language. Hidden with a note when the browser cannot do it.
 * Props: { onText(finalText), onInterim(text) }
 */
export default function VoiceButton({ onText, onInterim }) {
  const { t, i18n } = useTranslation();
  const ok = useSyncExternalStore(noop, supported, () => false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => () => recRef.current?.abort?.(), []);

  if (!ok) return <p className="ms-muted ms-mitra-novoice">{t('mitra.voiceUnsupported')}</p>;

  const start = () => {
    const R = recogniser();
    const rec = new R();
    rec.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim) onInterim?.(interim);
      if (finalText) onText(finalText.trim());
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') onInterim?.(t('mitra.voiceError'));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    onInterim?.(t('mitra.listening'));
    rec.start();
  };
  const stop = () => recRef.current?.stop();

  return (
    <button
      type="button"
      className={`ms-icon-btn ms-mitra-mic ${listening ? 'is-listening' : ''}`}
      aria-pressed={listening}
      aria-label={listening ? t('mitra.micStop') : t('mitra.mic')}
      onClick={listening ? stop : start}
    >
      <i className="fa-solid fa-microphone" aria-hidden="true"></i>
    </button>
  );
}
