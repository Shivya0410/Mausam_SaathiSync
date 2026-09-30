"use client";

import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from '../../config/site';

function applyToDocument(code) {
  const lang = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
  document.documentElement.lang = lang.htmlLang;
  document.documentElement.dir = lang.dir;
}

/**
 * Current UI language and a setter that persists it on this device and keeps
 * <html lang> and dir in step (WCAG 3.1.1).
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const setLanguage = useCallback(
    (code) => {
      if (!LANGUAGES.some((l) => l.code === code)) return;
      i18n.changeLanguage(code);
      applyToDocument(code);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      } catch {
        // Storage blocked (private mode): the choice lasts for this visit only.
      }
    },
    [i18n],
  );
  return { language: i18n.language, setLanguage };
}

/**
 * The server render always uses English (see src/i18n.js). After hydration
 * this switches to the saved language, so the first client render matches
 * the server and there is no hydration mismatch.
 */
export function LanguageSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (saved && saved !== i18n.language && LANGUAGES.some((l) => l.code === saved)) {
      i18n.changeLanguage(saved);
    }
    applyToDocument(saved || i18n.language);
  }, [i18n]);
  return null;
}
