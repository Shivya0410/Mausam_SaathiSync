import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';

// The server render always uses English (`lng: 'en'`): the saved language
// lives in localStorage, which does not exist on the server. LanguageSync
// (src/lib/i18n/useLanguage.js) switches to the saved language after
// hydration, so server and first client render match.
//
// English and Hindi are bundled. Machine-translated languages (PRD 15.4)
// will be registered lazily with i18n.addResourceBundle when added.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
