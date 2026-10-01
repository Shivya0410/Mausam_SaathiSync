import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';

// The server render always uses English (`lng: 'en'`): the saved language
// lives in localStorage, which does not exist on the server. LanguageSync
// (src/lib/i18n/useLanguage.js) switches to the saved language after
// hydration, so server and first client render match.
//
// Only English is bundled. Hindi (and future languages, PRD 15.4) load on
// demand through ensureLanguage, which keeps them out of every first load
// (PRD 13.8 budget).
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

const LOADERS = {
  hi: () => import('./locales/hi/translation.json'),
};
const loading = new Map();

/** Load a language's strings if needed. Resolves when t() can use them. */
export function ensureLanguage(code) {
  if (!LOADERS[code] || i18n.hasResourceBundle(code, 'translation')) return Promise.resolve();
  if (!loading.has(code)) {
    loading.set(
      code,
      LOADERS[code]()
        .then((mod) => i18n.addResourceBundle(code, 'translation', mod.default || mod, true, true))
        .catch(() => loading.delete(code)),
    );
  }
  return loading.get(code);
}

export default i18n;
