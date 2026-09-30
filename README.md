# Mausam Saathi

A personalised, multilingual weather homepage that turns IMD forecasts into daily decisions.

Smart India Hackathon 2026 · Ministry of Earth Sciences / India Meteorological Department · "Development of personalised homepage for 'Mausam' mobile application" · Team SaathiSync.

> **Prototype.** Mausam Saathi is not an official service of IMD or MoES. It shows official IMD and NDMA warnings exactly as issued, with attribution. Its own advice is labelled "Saathi tip" and never overrides an official warning.

## Build status

The work follows the build plan in [docs/EXECUTION-PLAN.md](docs/EXECUTION-PLAN.md).

- **Part 1 (done):** the shell and the whole data and logic layer.
  - The SaathiSync fitness features are removed. There is a new bilingual shell with placeholder pages for every PRD route.
  - The rules engine (50 rules), indices and homepage ranking are pure functions with tests.
  - The `/api/mausam/*` routes run on live data and fall back to demo fixtures.
- **Part 2 (done):** the personalised homepage, onboarding, alerts, forecast, the nine persona pages, household mode and settings, in English and Hindi. Checked with axe in Chrome, and it reflows at 320 px with 200% text.
- **Part 3:** camera features (Sky Snap, Jal-Bharav Watch, Dhundh Meter), the Mausam Mitra chatbot, map, preparedness, government (GIGW) pages, PWA, security headers and release.

## Setup

```bash
npm install
cp .env.example .env.local   # optional; everything has a safe default
npm run dev                  # http://localhost:3000
npm test                     # node --test, no network needed
npm run build
```

Node 22. This is Next.js 16 (App Router), which has breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before using an unfamiliar API (see [AGENTS.md](AGENTS.md)).

## How it works

```
Phone (PWA)                                   Next.js server
─────────────────────────────                 ───────────────────────────────────
personas, places, household   ── rounded ──▶  /api/mausam/snapshot
(stored on the device only)      lat/lon      │  Open-Meteo forecast, air, marine
                                              │  CPCB (key) or computed AQI
rules engine + ranking        ◀── snapshot ── │  IMD (whitelisted) + NDMA SACHET
(src/lib/mausam, pure JS)                     │  provider cache + fallbacks
decision cards, widget order                  └─ demo fixtures (labelled)
```

- **Personalisation runs on the device.** The server receives only coordinates rounded to about 1 km. It never learns who is asking (DPDP-friendly by design).
- **Official means official.**
  - IMD and NDMA warnings are shown verbatim. A tip that covers the same hazard as an active official warning is folded into the official card, never shown beside it.
  - When no official source answers, the app says it couldn't check. It never says "no warnings".
- **Demo data is always labelled.** Every fixture sets `isDemo: true`, and fixture warnings say "Demo of IMD warning format".

## Code map

| Path | What |
|---|---|
| `src/lib/mausam/` | Pure weather logic: thresholds, heat index, National AQI, Run Score, Comfort Index, spray window, frost, sea safety, tides, packing, leave-now, 50 rules (`rules/`), widget ranking, summary line |
| `src/lib/providers/` | Server adapters: Open-Meteo, IMD, NDMA SACHET (CAP), CPCB, aviationweather.gov, the snapshot orchestrator |
| `src/app/api/mausam/` | API routes (contract in [contracts/mausam-api.md](contracts/mausam-api.md)) |
| `src/config/` | Navigation, personas, widget registry (weights from PRD Appendix E) |
| `src/data/` | Seed data (cities, airports, beaches, emergency numbers, government services) and demo scenarios |
| `src/locales/{en,hi}` | All UI text. The key trees must match (a test enforces this) |
| `tests/` | `node --test` suites, including the PRD's 90-row rule matrix |

## Environment

See [.env.example](.env.example). Nothing is required to run.

| Variable | Effect |
|---|---|
| `SACHET_FEED_URLS` | Live NDMA disaster alerts (public; the all-India feed is in the example) |
| `IMD_API_ENABLED` + `IMD_PROXY_BASE_URL` | IMD warnings through a whitelisted static-IP proxy |
| `DATA_GOV_IN_API_KEY` | CPCB station AQI instead of the model estimate |
| `NEXT_PUBLIC_DEMO_MODE=true` | Demo scenario switch (for judging) |
| `FORCE_FIXTURES=true` | Serve fixture weather for any place |

## Demo scenarios

Add `&demo=<id>` to a snapshot request. In the app, build with `NEXT_PUBLIC_DEMO_MODE=true`: then `?demo=<id>` works on any page, and Settings › Demo scenarios lists them all.

| Id | What it shows |
|---|---|
| `delhi-winter-smog-fog` | Very Poor air, dense fog, airport fog |
| `mumbai-monsoon-red` | Red rain warning, high waves, 8 seeded waterlogging and sky reports |
| `chennai-cyclone` | Cyclone and fishermen warnings |
| `lucknow-heatwave` | Heat wave for outdoor workers |
| `punjab-village-frost` | Frost, spray window, agromet advisory |
| `goa-swell-alert` | Long-period swell, real-shaped tides |

## Data sources and attribution

- India Meteorological Department (when connected)
- NDMA SACHET
- CPCB National AQI
- [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- aviationweather.gov (NOAA)
- SunCalc
- © OpenStreetMap contributors

The IMD and MoES logos and the State Emblem are not used (PRD section 15.6).

## Known limitations

See [docs/OPEN-ISSUES.md](docs/OPEN-ISSUES.md).
