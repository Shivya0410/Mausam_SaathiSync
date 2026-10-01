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
  // Public origin for the sitemap and robots.txt (set SITE_URL in deployment).
  url: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  version: '0.3.0',
  // Optional public contact details (GIGW G11); the feedback form is the
  // default contact route when these are unset.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  repoUrl: process.env.NEXT_PUBLIC_REPO_URL || null,
};

/** UI languages fully reviewed today. Others arrive via Bhashini (PRD 15.4). */
export const LANGUAGES = [
  { code: 'en', label: 'English', htmlLang: 'en', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', htmlLang: 'hi', dir: 'ltr' },
];

export const LANGUAGE_STORAGE_KEY = 'mausam.lang.v1';

/**
 * Machine-translated languages planned through Bhashini (PRD 15.4), shown
 * disabled as "coming soon" until their translations are generated.
 */
export const UPCOMING_LANGUAGES = [
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'ur', label: 'اردو' },
];
