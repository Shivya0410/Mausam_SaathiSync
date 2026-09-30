/**
 * Site-wide constants (PRD sections 4 and 15).
 */
export const SITE = {
  name: 'Mausam Saathi',
  shortName: 'Mausam Saathi',
  description:
    'A personalised, multilingual weather homepage that turns IMD forecasts into daily decisions. Prototype for Smart India Hackathon 2026.',
  themeColor: '#493971',
  // "Last updated" date shown in the footer (GIGW G13). Change on content releases.
  lastUpdated: '2026-09-30',
  nationalPortal: 'https://www.india.gov.in',
};

/** UI languages fully reviewed today. Others arrive via Bhashini (PRD 15.4). */
export const LANGUAGES = [
  { code: 'en', label: 'English', htmlLang: 'en', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', htmlLang: 'hi', dir: 'ltr' },
];

export const LANGUAGE_STORAGE_KEY = 'mausam.lang.v1';
