# Open issues

This file records things that cannot be closed from inside this repository,
or that were deliberately deferred. It was last updated at the end of build
plan Part 2 (30 Sep 2026). Keep it current.

## Blockers for a real rollout

### 1. IMD API access needs IP whitelisting

IMD's API answers unlisted callers with HTTP 401 ("IP ... needs to be
whitelisted"). This was checked on 30 Sep 2026. Serverless hosts such as
Vercel have no fixed outbound IP.

The adapter (`src/lib/providers/imd/`) is built to IMD's published API
reference, including its two opposite colour scales. It is off by default
(`IMD_API_ENABLED=false`). To connect IMD, do one of the following:

- run a small proxy on a static IP that IMD has whitelisted, and set
  `IMD_PROXY_BASE_URL`; or
- use access that IMD provides for SIH teams.

Until then, official warnings come from NDMA SACHET only. The adapter's
district-name matching is untested against live IMD data.

### 2. District mapping is heuristic

Warnings are matched to a place by district and state names.

- **Place names:** these come from the search result, or else from the
  nearest of the 12 bundled cities.
- **SACHET alerts** match a place only if one of these holds:
  - their polygon contains the point;
  - their area text names the district;
  - they cover the whole state.

  Other alerts in the same state go to `regionalWarnings`, never to cards or
  the ribbon. This was checked live: a Balrampur flood alert does not become a
  Lucknow warning.
- **What is missing:** a district index built from IMD
  (`scripts/build-imd-index.mjs`, PRD section 12.2.1) and a districts GeoJSON.
  Both are needed for exact matching.

### 3. There is no durable store yet

Crowd reports, feedback and push subscriptions (Part 3) need `DATABASE_URL`.
The in-memory adapter loses data on every restart and every serverless cold
start. `/api/mausam/health` reports `durable: false`.

## To verify before release

These values are marked VERIFY in code:

- **Emergency numbers:** 1070, 1077, 1078 and 1554 in
  `src/data/emergencyNumbers.js`.
- **CPCB:** the data.gov.in resource id (`CPCB_RESOURCE_ID`) and the Severe
  band upper bounds in `naqi.js`. Severe-band upper bounds are not published
  and only shape interpolation up to the cap of 500.
- **Play Store ids:** Mausam, Meghdoot and Damini in `src/data/govServices.js`.
- **Coordinates and flags:**
  - airports, in `src/data/airports.js`;
  - beaches and their `ripProne` flags, in `src/data/beaches.js`.
- **Mappls deep link** on the Commute page (`src/components/commute/CommutePage.js`): the URL format is unverified.
- **Cool-spot coordinates** in `src/data/coolSpots/index.js` (Delhi, Ahmedabad, Mumbai, Hyderabad, Lucknow): check each place and its public access.
- **Planting guide** (`src/data/plantingGuide.js`): an agronomist should review the crops by zone and season, including the Hindi names.
- **Tips and first aid** text (heat stroke, cold exposure, lightning, beach, livestock) paraphrases NDMA guidance. Check it against the current NDMA documents.
- **Open-Meteo terms** for a government deployment. Commercial or high-volume
  use needs their paid plan or self-hosting.

## Known unfixed issues

- **Placeholder pages.** The Part 3 routes (map, Sky Snap, reports, ready,
  learn and the government pages) still show "This page is being built",
  with a link to IMD. The homepage and all Part 2 pages are live.
- **Deferred page sections (Part 3).** The Health page has no hospitals map
  and the Commute page has no waterlogging reports. The Travel page has no
  IMD highway forecasts, which need IMD access (see 1). The pages say so.
- **The register form collects "medical complications".** This comes from the
  legacy optional sign-in. It conflicts with the data-minimisation stance in
  PRD section 15.5, and needs removing (or the backend changing) before
  release.
- **Adapt-later files kept for Parts 2 and 3.** These files are not rendered
  by any route yet:
  - `views/trackersheet/Tracker.js`
  - `utils/badges.js`
  - `config/xpPolicy.js`, which still uses pillars Y/M/E/C
  - `components/wellness/*`
  - `components/shefit/MythOrFact.js`
  - `components/shefit/SavedPins.js`
  - `components/profile/{ProfilePreferences,GuestBanner,XpPreview,ActivityHeatmap}.js`
  - `components/shared/ChatbotFloat.js`
  - `components/gov/GovBanner.js`
  - `components/map/LeafletMap.js`

  Deleted reference files are recoverable from the baseline commit
  (`5a56719`). In particular, `components/seniorFitness/ChairStandTest.js`
  is the camera lifecycle template for Part 3.
- **Lint.** Part 2 files lint clean. Seven errors remain in untouched
  adapt-later files: `GoogleAuthButton.jsx`, `register.js`, `ChatbotFloat.js`,
  `SavedPins.js`, `ClinicMap.js` and `Tracker.js` (mostly
  `react-hooks/set-state-in-effect`). They will be fixed as those files are
  adapted.
- **Fonts.** Noto Sans and Noto Sans Devanagari are fetched from Google Fonts
  at build time, so `npm run build` needs network access.

## Closed by the migration

The following SaathiSync items were removed with the fitness features:

- fabricated dashboard figures;
- unverified tennis and meditation venues;
- hotlinked third-party images;
- activity tiles with no destination;
- the calorie, Yoga and PostList bugs.

The admin client code is gone, so the app no longer calls `/api/admin`. The
backend's open admin registration endpoint is still outside this repository.
The Python recommender (for `/api/v1`) is out of scope for Mausam Saathi.
