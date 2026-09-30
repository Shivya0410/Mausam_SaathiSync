import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';

// `i18next-browser-languagedetector` used to be installed here, but it reads
// `navigator`, `document.cookie` and `localStorage`, none of which exist during
// the Next.js server render. It was already inert in practice: `lng: 'en'`
// below pins the initial language, so detection never ran. Language is chosen
// through the LanguageSwitcher component instead.
// Resources are bundled at build/dev-compile time: touching this file forces
// a fresh compile of the locale chunks (tracker.lastMonth and friends).
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
