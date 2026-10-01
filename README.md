# Mausam Saathi

A personalised, bilingual weather homepage that turns IMD forecasts into daily decisions.

Smart India Hackathon 2026 · Ministry of Earth Sciences / India Meteorological Department · "Development of personalised homepage for 'Mausam' mobile application" · Team SaathiSync.

> **Prototype.** Mausam Saathi is not an official service of IMD or MoES. It shows official IMD and NDMA warnings exactly as issued, with attribution. Its own advice is labelled "Saathi tip" and never overrides an official warning.

## What it does

- **Personalised homepage.**
  - Decision cards ("Today for you") come from 50 published rules.
  - Widgets are ranked by what you do (10 personas), the season, the time of day and active warnings.
  - Every card says why it is shown.
- **Official warnings first.**
  - IMD and NDMA SACHET warnings are shown verbatim, with a ribbon on every page and an Alerts centre.
  - When sources cannot be reached, the app says "Couldn't check", never "No warnings".
- **Nine persona pages:** Health, Run and play, Beach and sea (with a fisher mode), Travel, Family, Farm, Commute, Event planner and Outdoor work. Also Household mode, Forecast and Map.
- **On-device camera features.**
  - Sky Snap (cloud type) and Jal-Bharav Watch (flooded street) use TensorFlow.js.
  - Dhundh Meter (fog estimate) uses the dark channel prior.
  - Photos never leave the phone.
- **Crowd reports.** They are anonymous and snapped to a 500 m grid. They are rate limited and verified by AI confidence or by two people. They feed the commute and school-run cards, and can be exported for city disaster cells.
- **Mausam Mitra.**
  - A grounded chatbot in English, Hindi and Hinglish, with voice in and out.
  - It answers only from the same data and rules as the homepage.
  - Emergency phrases get an immediate 112 and 108 reply.
- **Be ready and Learn:**
  - preparedness habits with badges;
  - 12 bilingual safety articles;
  - a weather myths quiz.
- **Government compliance (GIGW 3.0):**
  - About, Help, Feedback, Contact, Sitemap, Accessibility statement, Screen reader access and eight policies;
  - WCAG 2.1 AA;
  - an installable app (PWA) with offline support;
  - security headers.

## Setup

```bash
npm install
cp .env.example .env.local   # optional; everything has a safe default
npm run dev                  # http://localhost:3000
npm test                     # node --test, no network needed
npm run lint
npm run build
```

Node 22. This is Next.js 16 (App Router), which has breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before using an unfamiliar API (see [AGENTS.md](AGENTS.md)).

| Script | What it does |
|---|---|
| `npm test` | Runs about 300 unit tests. They cover the rules matrix, indices, ranking, reports, Mitra, Be ready, the CV logic and i18n parity. |
| `npm run check:browser` | Runs axe, 320 px reflow (also at 200% text with high contrast), raw-key, console/CSP, Hindi, demo and onboarding checks on every route, in Chrome. Start a demo-mode build first; see the script header. |
| `npm run icons` | Rebuilds the Font Awesome subset (`src/styles/icons.css` and `public/fonts/`) after you add an icon. Subsetting the fonts needs Python `fonttools`. |

## Architecture

```
┌──────────────────────── User's phone (PWA) ─────────────────────────┐
│ UI: Home · Alerts · Forecast · Map · persona pages · Mitra          │
│ Personalisation (on device): personas, household, ranking, rules,   │
│   indices, Mitra replies          ← pure JS in src/lib/mausam, mitra │
│ On-device CV: Sky Snap · Jal-Bharav (TF.js, models optional)        │
│   · Dhundh Meter (dark channel)   ← src/lib/cv                       │
│ Device storage (mausam.* keys): places, personas, household,        │
│   layout, Be ready, cached weather                                   │
│ Service worker: offline shell, cached pages and weather, models     │
└──────────────┬────────────────────────────────────┬─────────────────┘
               │ rounded coordinates only           │ label-only reports
┌──────────────▼──────────── Next.js server ─────────▼────────────────┐
│ /api/mausam/*: snapshot · warnings · air · marine · airport ·       │
│   climatology · places · reports (+vote, export) · feedback · health │
│ Provider adapters + LRU cache + fallbacks (src/lib/providers)       │
│ Repositories: in-memory (default); Postgres not yet built           │
└───┬───────────┬─────────────┬────────────┬────────────┬─────────────┘
  IMD APIs   Open-Meteo     CPCB via     NDMA SACHET  aviationweather
  (needs IP  (forecast, AQ, data.gov.in  (CAP feeds)  .gov (METAR/TAF)
  whitelist) marine, geo)   (key)
```

- **Personalisation runs on the device.** The server receives only rounded coordinates, so it never learns who is asking (DPDP-friendly by design).
- **Official means official.**
  - A tip on the same hazard as an active official warning is folded into the official card, never shown beside it.
  - Fixture warnings say "Demo of IMD warning format".
- **Demo data is always labelled.**

## Code map

| Path | What |
|---|---|
| `src/lib/mausam/` | Pure weather logic: thresholds, indices, 50 rules, ranking, cards, notifications, reports, Be ready |
| `src/lib/mitra/` | Mitra: normalise, safety, intents, slots, `respond()` |
| `src/lib/cv/` | Dark channel haze score, model decisions, TF.js loader (dynamic import) |
| `src/lib/providers/` | Server adapters and the snapshot orchestrator |
| `src/server/` | Route wrappers, validation, rate limiting, report and feedback domain, repositories |
| `src/app/` | Pages and API routes (contract: [contracts/mausam-api.md](contracts/mausam-api.md)) |
| `src/components/` | UI by area (home, widgets, alerts, persona pages, cv, mitra, map, ready, learn, gigw, layout) |
| `src/locales/{en,hi}` | All UI text. The key trees must match (a test enforces this). Hindi loads on demand. |
| `ml/` | Training scripts and install notes for the two TF.js models |
| `tests/` | `node --test` suites |

## Environment

See [.env.example](.env.example). Nothing is required to run.

| Variable | Effect |
|---|---|
| `SACHET_FEED_URLS` | Live NDMA disaster alerts. Public; the all-India feed is in the example. |
| `IMD_API_ENABLED`, `IMD_PROXY_BASE_URL` | IMD warnings through a whitelisted static-IP proxy |
| `DATA_GOV_IN_API_KEY` | CPCB station AQI instead of the labelled model estimate |
| `NEXT_PUBLIC_DEMO_MODE=true` | Demo scenarios (`?demo=<id>`, Settings › Demo scenarios). Use for judging. |
| `FORCE_FIXTURES=true` | Fixture weather for any place |
| `REPORTS_EXPORT_KEY` | Enables `GET /api/mausam/reports/export`. Send the key in the `x-export-key` header (16 or more characters). |
| `REPORTS_SALT` | Salt for hashed report device ids. Unset means a random salt per server start. |
| `SITE_URL` | Public origin for `sitemap.xml` and `robots.txt` |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_REPO_URL` | Shown on `/contact`. When unset, the page points to the feedback form. |
| `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional legacy sign-in. No feature depends on it. |

## Demo

Build with `NEXT_PUBLIC_DEMO_MODE=true`, then open any page with `?demo=<id>`, or use Settings › Demo scenarios.

| Id | What it shows |
|---|---|
| `delhi-winter-smog-fog` | Very Poor air, dense fog, airport fog |
| `mumbai-monsoon-red` | Red rain warning, high waves, 8 seeded waterlogging and sky reports |
| `chennai-cyclone` | Cyclone and fishermen warnings |
| `lucknow-heatwave` | Heat wave for outdoor workers |
| `punjab-village-frost` | Frost, spray window, agromet advisory |
| `goa-swell-alert` | Long-period swell and real-shaped tides |

For the 7-minute demo script (PRD 17.5), note one thing. **No trained Sky Snap or Jal-Bharav model ships**, because the dataset licences still need checking. Without a model, both features run a manual path: the user picks the cloud type, or confirms the flooding. The result is labelled "not checked by AI", and reports are stored as "needs confirming". To show AI results, train and install the models first ([ml/README.md](ml/README.md)).

## Testing and quality

| Check | Result |
|---|---|
| `npm test` | 305 tests pass |
| `npm run lint` | No errors |
| `npm audit` | 0 vulnerabilities |
| `npm run check:browser` | All 34 routes: no serious or critical axe issues, no horizontal scroll at 320 px (also at 200% text with high contrast), no raw keys, no console or CSP errors |
| Lighthouse, mobile (median of 3 runs, demo build) | Home 80, Alerts 81, Onboarding 82. Accessibility, Best Practices and SEO are 100. |

Not done yet:

- A test on a real mid-range Android phone.
- Screen-reader user testing.
- A review of the Hindi text by a fluent speaker.

## Deployment

The app is not deployed yet. On Vercel:

1. Import the repository.
2. Set `NEXT_PUBLIC_DEMO_MODE=true`, `SACHET_FEED_URLS` and `SITE_URL`.
3. Optionally set `DATA_GOV_IN_API_KEY` and `REPORTS_EXPORT_KEY`.
4. Deploy.

Crowd reports use the in-memory store, so they reset on each cold start. Feedback does too.

## Data sources and attribution

- India Meteorological Department (warnings, when connected)
- NDMA SACHET
- CPCB National AQI
- [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- aviationweather.gov (NOAA)
- SunCalc
- © OpenStreetMap contributors
- Font Awesome Free: icons CC BY 4.0, fonts SIL OFL 1.1

The IMD and MoES logos and the State Emblem are not used (PRD 15.6).

## Known limitations

See [docs/OPEN-ISSUES.md](docs/OPEN-ISSUES.md).
