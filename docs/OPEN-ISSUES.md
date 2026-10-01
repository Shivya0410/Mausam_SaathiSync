# Open issues

This file records things that cannot be closed from inside this repository,
or that were deliberately deferred. It was last updated at the end of build
plan Part 3 (1 Oct 2026). Keep it current.

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
- **About page figures** (lightning, heat, fog and flood deaths) come from
  PRD 1.5. Check each against its source before release.
- **Dataset licences** for CCSN and the flood image sets, before training or
  shipping a model (see `ml/README.md`).
- **Open-Meteo terms** for a government deployment. Commercial or high-volume
  use needs their paid plan or self-hosting.

## Known unfixed issues

- **No trained on-device models.** The Sky Snap and Jal-Bharav pipelines,
  loaders and training scripts are built (`ml/`). No model ships, because the
  CCSN and flood dataset licences need checking first. Until a model is
  listed in `public/models/index.json`, both features use a manual path:
  - the user picks the cloud type, or confirms the flooding;
  - the result is labelled "not checked by AI";
  - reports are stored as "needs confirming", never as AI-verified.

  The 700 ms per photo and the tensor-leak checks (PRD exit criteria) can
  only be measured once a model is installed.
- **Dhundh Meter bands are provisional.** They follow the PRD but are not
  calibrated on labelled photos yet (PRD 11.3).
- **Crowd reports and feedback are in memory.** They reset on every restart
  and serverless cold start. A Postgres adapter (`DATABASE_URL`, PRD 13.5)
  is not built.
- **Push notifications are not built** (Web Push and cron, PRD 7.4 Phase 2).
  Only in-app and local notifications work, and only while the app is open.
- **Map layers not connected:**
  - district polygons, cyclone track, rain radar and lightning;
  - AQI pins are shown only for your saved places, not CPCB stations;
  - the Health page has no nearby-hospitals map.
- **Mitra knows only 12 bundled cities.** Other places are geocoded through
  Open-Meteo. The 5,000-place gazetteer (PRD 10.5) needs a GeoNames build
  with attribution.
- **Household members share the owner's place.** A member with a different
  home city (edge case E14) is not supported.
- **Edge cases not yet handled:**
  - E4: coordinates at sea are not named "Sea area near …";
  - E22: English-only official text is labelled, but there is no translate
    button (Bhashini);
  - E13: right-to-left languages, since no RTL language is offered yet.
- **First-load JavaScript is over the 200 KB budget** (PRD 13.8). Measured
  gzipped first load, demo build:
  - Home is about 300 KB, and most other pages about 265 KB;
  - React and Next.js alone are about 153 KB;
  - i18next with the English strings is about 39 KB.

  TensorFlow.js and Leaflet are not on the homepage, and Hindi loads on
  demand. Lighthouse mobile still meets its targets: Performance 80 on Home,
  Accessibility 100.
- **Experimental Next.js option.** `experimental.inlineCss` is on, to avoid
  render-blocking CSS. Remove it if it misbehaves on a Next upgrade.
- **The alert ribbon is docked at the bottom of the screen.** The PRD puts it
  below the top bar. In the page flow it pushed the whole page down after
  warnings loaded (CLS 0.87), so it now sits above the mobile tab bar.
- **The legacy sign-in still collects age and gender.** The medical field is
  removed (the backend receives an empty list), but name, age and gender are
  more than this app needs (PRD 15.5).
- **Privacy-preserving analytics and client error counting** (PRD 22.3) are
  not built.
- **Not done:**
  - deployment to Vercel;
  - a rehearsal on a mid-range Android phone (PRD 17.5);
  - screen-reader user testing;
  - a review of all Hindi text by a fluent speaker.
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
