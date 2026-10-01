# Mausam Saathi: Execution Plan in 3 Parts

Source of truth: `Mausam_Saathi_PRD.pdf` (v1.0, 29 Sep 2026). Section numbers below (§) refer to it.
Task IDs (T0.x, T1.x, T2.x, T3.x) are the PRD's own (§17.3).

Every part must end with `npm run build` and `npm test` passing (§0.1 rule 9). Before touching Next.js APIs, read `node_modules/next/dist/docs/` (AGENTS.md).

| Part | Theme | PRD phases covered | Demo-ready at end? |
|---|---|---|---|
| 1 | Clean shell + data and logic engine | Phase 0, back half of Phase 1 (data, rules, ranking) | No UI yet, but the APIs return real snapshots and ~150 tests pass |
| 2 | The personalised homepage and core pages | Front half of Phase 1, persona pages, household, settings | Yes: the judge path in §17.5 steps 1 to 5 works |
| 3 | Differentiators, compliance and ship | Rest of Phase 2, polish, Phase 3 stretch | Yes: full 7-minute demo (§17.5) |

**Parallel track (starts on day 1, outside the app code):** ML training for Sky Snap (CCSN) and Jal-Bharav Watch, plus collecting 30+ Indian flooded/wet street photos and 30 to 50 fog photos (§11.1 to §11.3, `ml/`). Part 3 consumes the converted TF.js models; if they are not ready, use the kNN fallback (§11.1).

---

## Part 1: Clean shell + data and logic engine

**Goal:** turn SaathiSync into an empty Mausam Saathi shell that builds, then build everything below the UI: pure weather logic, provider adapters and our API routes. This is the part with the most tests and the least visual output.

### 1A. Clean shell (Phase 0)
- **T0.1 Rebrand:** `package.json` name `mausam-saathi`, `src/app/layout.js` title/description/theme colour, navbar copyright, README stub.
- **T0.2 New navigation:** rewrite `src/config/navItems.js` (§4.2 table); update `tests/profile-nav.test.mjs`.
- **Placeholder routes first**, then **T0.3 Delete** everything marked DELETE in §14.1 to §14.5 (routes, components, views, data, utils, public assets, `shims/mediapipe-pose.js`, `styled-components-registry.js`, dev `*.log` files). Remove packages listed in §13.1 (pose-detection, mediapipe, tfjs-backend-webgpu, aframe, font-awesome v4, gsap, styled-components, axios; check bootstrap, react-select, leaflet.awesome-markers usage first). Add `suncalc`, `fast-xml-parser`.
- **T0.4** `next.config.js`: new `redirects()` (§4.1), remove styled-components flag and mediapipe aliases; new `not-found.js` with links to Home, Alerts, Forecast.
- **T0.5 Layout skeleton:** `TopBar` (skeleton), `SiteFooter`, `BottomTabBar`, `SkipLink`; `WithNavbar` wraps header/nav/main/footer landmarks (§4.4). Remove floating `LanguageSwitcher` and `WhatsAppFloat` from UI.
- Tokens: add all `--ms-*` tokens and `.ms-hc` / text-scale classes to `src/styles/tokens.css` (§16.2). Keep `--swasth-*`.
- i18n: restructure `src/locales/{en,hi}/translation.json` into the §Appendix C namespaces; add `tests/i18n-parity.test.mjs`.

### 1B. Pure logic in `src/lib/mausam/` (§6, §27.1 to §27.5)
- `thresholds.js`, `season.js`, `time.js` (IST helpers, time of day, hour windows), `wmo.js` (Appendix B), `types.js` (JSDoc typedefs, §12.3), `summary.js` (§5.4).
- `indices/`: `heatIndex.js`, `naqi.js` (all pollutants, Appendix A.3), `runScore.js`, `outdoorComfort.js`, `comfortIndex.js`, `sprayWindow.js`, `frost` (inside farm or its own file), `allergyEstimate.js`, `seaSafety.js`, tide extrema, `packing.js`, `commute.js` (leave-now verdict, §6.6.10).
- `rules/`: `index.js` (runRules with official-first ordering, suppression, cap 6, good-news fallback, dismissals, §6.4), `official.js` (§6.5 incl. official advice add-ons), `general.js`, and all persona rule files: all 50 rules in §6.7.
- `rankWidgets.js` + `src/config/widgets.js` (all 35 widgets, Appendix E weights) + `src/config/personas.js` (§3.2).
- Tests: the full 90-row matrix in §23 plus the ranking tests in §5.11 and index worked examples (§27.2).

### 1C. Providers and API routes (§12, §13.3, §13.5)
- `src/server/http/handler.js`: add `cachedPublicRoute` next to `publicRoute`.
- `src/server/cache/lru.js`.
- `src/lib/providers/`: `openMeteo/` (forecast, air quality, marine, archive, geocoding), `imd/` (behind `IMD_API_ENABLED`, `warningCodes.js`), `sachet/` (CAP parser, behind `SACHET_FEED_URLS`), `cpcb/` (behind `DATA_GOV_IN_API_KEY`), `aviation/` (METAR/TAF + `decode.js`), `snapshot.js` orchestrator (Promise.allSettled, priority order §12.1, 4 s timeouts, stale cache, fixture fallback, `FORCE_FIXTURES`).
- **Warnings never fall back to fixtures**: return `warningsStatus: 'unavailable'` (§12.5).
- Routes under `src/app/api/mausam/`: `snapshot`, `warnings`, `places/search`, `air`, `marine`, `airport`, `climatology`, `health`.
- Six demo fixtures in `src/data/fixtures/` with relative time offsets (§24.1 to §24.6).
- Seed data: `airports.js`, `beaches.js`, quick-pick cities (§26.1), emergency numbers (§26.2), gov services (§26.3), `cloudTypes.js` (§11.1, §26.5).
- `.env.example` with every variable in §13.11. `contracts/mausam-api.md`.

**Exit criteria**
- Build and tests pass; no fitness wording in UI or translation files; bundle has no pose-detection, aframe, styled-components.
- Redirects work; 404 page shows helpful links; landmarks and skip link present; no horizontal scroll at 320 px.
- `GET /api/mausam/snapshot?lat=19.08&lon=72.88` returns a valid `WeatherSnapshot`; with `FORCE_FIXTURES=true` returns `isDemo: true`.
- ≥ 150 tests including all 90 rule matrix rows; en/hi parity test passes.

---

### Part 1 status: done (30 Sep 2026)

All exit criteria met: build passes, 234 tests pass (all 90 matrix rows), live snapshots verified for Lucknow, Goa and London, and `FORCE_FIXTURES` returns `isDemo: true`. What changed from the plan, for Part 2 to know:

- **IMD** needs IP whitelisting (HTTP 401). The adapter follows IMD's published reference and is off by default. Official warnings come live from **NDMA SACHET** (`SACHET_FEED_URLS`).
- **Warning scope.** The snapshot splits `warnings` (this place: cards and ribbon) from `regionalWarnings` (same state, other districts: Alerts page only). Use only `warnings` for the ribbon and cards.
- **Snapshot params.** `/api/mausam/snapshot` also accepts `name`, `district` and `state` from the search result. Pass them for better warning matching.
- **PIN codes** don't geocode. Search returns `hint: 'place_name'`.
- **Warning status.** `officialStatus()` in `src/lib/mausam/warnings.js` gives the Now card chip state. It never returns "no warnings" for missing data.
- **Rule text** is already in both locales (`rules.<id>.headline|reason|why`, `verdicts.*`, `officialAdvice.*`). Components format times and pass them as params.
- **Deleted reference files** are recoverable from the baseline commit `5a56719`, for example `git show 5a56719:src/components/onboarding/OnboardingQuiz.js`.
- **Security headers** (13.10) are still in Part 3E as planned.

---

## Part 2: The personalised homepage and core pages

**Goal:** everything a judge sees in the first four minutes. Onboard in under 60 s, get a persona-ranked homepage with decision cards, official warnings, Hindi, and accessibility tools.

### 2A. Client foundation
- Stores (useSyncExternalStore pattern from `trackerStore.js`): `placesStore`, `settingsStore`, `householdStore`, `layoutStore`. All device storage under `mausam.*` keys via `userScopedStorage` (§13.6).
- Hooks: `useSnapshot` (§27.8), `usePlaces`, `usePersonas`, `useHousehold`, `useA11y`, `useOnline`, `useGeolocation`.
- Providers in `src/app/providers.js`: `A11yProvider` (html classes, lang/dir switching), `PlaceProvider`, `SettingsProvider`. `services/onboarding.js` → `mausam.onboarding.v1`.

### 2B. Chrome and accessibility (T1.15, §5.3, §20.1, §20.2, §20.14)
- Full `TopBar`: `PlaceSwitcher` + `PlaceSearch` (combobox pattern), `LanguageMenu` (EN/HI now, other languages listed), `A11yMenu` (text size, contrast, simple view, reduce motion, lite mode, read aloud), `AlertsBell`, offline and lite chips.
- `AlertRibbon` (§7.3, §20.9) on every page.
- Navbar adapted: sidebar ≥ 768 px, bottom tab bar below; `aria-current`; "My pages" panel.
- Shared: `SourceBadge`, `SampleDataBadge` variants (demo, estimate, stale, machineTranslated), `LevelBadge` with shape icons.

### 2C. Homepage (T1.9 to T1.12, §5, §20.3 to §20.8)
- `src/components/home/`: `GreetingLine`, `NowCard`, `DecisionCard`, `DecisionCardList` (Why?, Listen, Helpful, Dismiss, See all), `MyPagesChips`, `WidgetGrid` (greedy 12/8/1-column packing, DOM order = visual order), `DataFootnote`, `GovServicesStrip` (adapted `GovBanner`), `MapTeaser`, `ReportsTeaser` (placeholder until Part 3).
- Charts in `src/components/charts/`: `HourBand`, `LineChart`, `BarChart`, `AqiDial`, `Gauge`, `TideCurve`, `DataTable` (every chart has a text summary and "Show as table").
- Widgets in `src/components/widgets/`: first the 14 from T1.12 (aqi, bestTimeOut, uv, humidityHeat, runWindow, sunTimes, wind, rainSoon, rain5Day, visibility, lightning, heatDanger, hourly, daily), then the rest of §5.8 as persona pages need them. Each has loading, ready, error, demo and "Not available" states.
- Simple view (§20.14).

### 2D. Onboarding and alerts
- **T1.13** Rewrite `OnboardingQuiz.js` (5 skippable steps, §5.10, §18.4), context suggestions (coastal, rural, winter North India), coast/fisher follow-up.
- **T1.14** `/alerts` (§7.2, §18.5): place tabs, nowcast, 5-day strip, SACHET, marine, cyclone, colour legend, emergency numbers; "Couldn't check" state, never a false "No warnings".
- Local notifications for new Orange/Red (Phase 1 channel in §7.4) and "Send test alert".

### 2E. Pages
- `/forecast` (§9.2, §18.6).
- **T2.7 persona pages** on the shared template (§8): Health, Run, Commute, Farm first; then Coast (with fisher mode), Travel (trips, packing, METAR), Family, Events (comfort calendar, compare dates, climatology), Work (heat band, cool spots, lightning 30-30 takeover). Add `coolSpots/<city>.js` (Delhi, Ahmedabad, Mumbai, Hyderabad, Lucknow) and `plantingGuide.js`.
- **T2.8 Household** `/household` + `MemberSwitcher` + merged "Everyone" cards + per-member read aloud (§3.6, §18.3).
- `/settings` (§9.5): places, personas, homepage layout with rank reasons and Move up/down, notifications, language and voice, a11y, data export/delete, optional sign-in, **Demo scenarios** switch (T1.5, §24.7, `?demo=` param).
- Usage nudges (§3.5 layer 4), install prompt deferred to Part 3.

**Exit criteria**
- A new user reaches a personalised homepage in under 60 s, minimum 2 taps (§2.5).
- Switching persona reorders widgets as the §5.11 tests say; official cards first and not dismissible; tips suppressed under matching official warnings.
- Full Hindi UI; html `lang` switches; text size up to 200% with no clipping; high contrast works; keyboard reachable everywhere.
- All 9 persona pages render with honest labels (allergy estimate, tides unavailable, traffic deep link).
- Demo scenarios load and every screen shows "Demo data".
- axe: 0 serious/critical on Home, Alerts, Onboarding.

### Part 2 status: done (30 Sep 2026)

All exit criteria met: build passes, 266 tests pass, and ESLint is clean on Part 2 files. Checked in installed Google Chrome (playwright-core and axe-core) on all 15 Part 2 routes with a demo scenario:

- axe: 0 serious or critical issues on every route, not just Home, Alerts and Onboarding.
- No horizontal scroll at 320 px, at 100% text and at 200% text with high contrast.
- Hindi renders on Home, Alerts, Settings and Work with no raw translation keys.
- "Demo data" shows on demo scenarios, and a Red scenario shows the alert ribbon.
- A fresh phone is redirected to onboarding and reaches a Delhi homepage in 2 taps ("Use New Delhi for now", then "Skip, show me the weather").

What Part 3 needs to know:

- **Where state lives.** Device state is in `src/lib/stores/index.js` (`stores.*`, all under `mausam.*` keys). React reads it through `useStore`. `WeatherProvider` gives place, snapshot and demo; `usePersonal()` gives the personal view.
- **Widgets.** A widget is a component in `src/components/widgets/index.js` plus its id in `available.js`. A test keeps the two lists equal. `mapTeaser`, `readyStreak` and `waterlogging` are configured but have no component yet (Part 3).
- **Card text.** `cardText()` formats cards. A test renders every card from every demo scenario, for every persona, in EN and HI. It fails on any unfilled `{{var}}` or raw key.
- **i18n.** Scratchpad scripts were used to find missing keys. The UI is complete. The legacy adapt-later files (listed in OPEN-ISSUES) still have missing keys.
- **Planner helpers.** `weekendPlan`, `dateComfort` and `mmss` are in `src/lib/mausam/plans.js`.
- **Deferred to Part 3:**
  - hospitals map (Health);
  - waterlogging reports (Commute);
  - highway forecasts (Travel);
  - map teaser;
  - push notifications (local notifications work now);
  - install prompt.

---

## Part 3: Differentiators, compliance and ship

**Goal:** the features that make the pitch stand out, government compliance, and a deployed, tested build.

### 3A. Crowd reports (T2.1, §11.2, §13.5)
- Repository extension: `reports`, `votes`, `feedback`, `push`, `warningState` in `types.js` + `memory.js` (+ `postgres.js` if `DATABASE_URL` is available, T3.2).
- Routes: `reports` (GET/POST, rate limits, grid rounding, location-jump rejection), `reports/[id]/vote`, `reports/export` (admin key), `feedback`.
- Seed demo reports (§26.4). `/reports` page (adapted `CommunityHub` tabs, §9.7). Wire the `waterlogging` widget and `commute.waterlogging` / family cards to real reports.

### 3B. On-device CV (T2.2 to T2.5, §11, §18.7, §18.8, §20.10, §20.11)
- `CameraCapture` built from the `ChairStandTest` lifecycle (warm-up, dispose, gallery fallback), then delete the originals.
- **Sky Snap** `/sky-snap`: `lib/cv/skySnap.js`, model in `public/models/sky-snap/` (or kNN fallback), result card combined with forecast, share to map, `sky_watcher` badge.
- **Jal-Bharav Watch** `/report`: classifier, severity picker, AI-verified / unverified tiers, submit.
- **Dhundh Meter**: `lib/cv/darkChannel.js` with synthetic-image tests, "too dark" handling.
- Model cards on `/about#models` with measured accuracy only.

### 3C. Mausam Mitra (T2.6, §10, §21.4, §27.12)
- `src/lib/mitra/`: `normalise`, `intents` (24 + greeting, thanks, language.switch), `slots`, `handlers/*`, `templates`, `safety` (emergency escalation first).
- `MitraPanel` (rewritten `ChatbotFloat`, dialog with focus trap) + `VoiceButton` (Web Speech in and out).
- 120+ utterance tests; every emergency phrase triggers the 112/108 reply.

### 3D. Map, Be ready, Learn (T2.9 to T2.11)
- `/map` (§9.1): generalised `LeafletMap`, layers for my places, reports, AQI, cool spots, warning pins; list view; lite mode shows list only.
- `/ready`: Tracker with pillars A, P, S, H by season, seasonal checklists, new `BADGE_DEFS`, XP caps (§9.4, §18.15).
- `/learn` + `/learn/[slug]`: 12 articles EN/HI (§21.1) + weather myths quiz with `weather_wise` badge (§21.2).

### 3E. Compliance and PWA (T2.12, T2.13, §13.7 to §13.10, §15)
- GIGW pages: About, Help, Feedback, Contact, Sitemap, Accessibility statement, Screen reader access, Policies hub + privacy, terms, copyright, hyperlinking, disclaimer. `app/sitemap.js`, `app/robots.js`.
- External-link notices, footer ownership and attribution, india.gov.in link.
- `app/manifest.js`, `public/sw.js` (§27.11), `/offline`, install card after second visit, SW update toast. Delete `public/manifest.json`.
- Lite mode auto-detection (§13.9).
- Security headers in `next.config.js` (§13.10); `npm audit` clean of high/critical.

### 3F. Hardening and release (§17.4, §22)
- Edge cases E1 to E25 (§22.1), error pattern (§22.2), `/api/mausam/health` status on About page.
- axe on all pages in §22.4 item 4; 320 px reflow pass; Lighthouse mobile (Performance ≥ 80, Accessibility ≥ 95); TF.js absent from the homepage bundle.
- README (setup, env vars, data sources and attributions, architecture diagram §13.12, demo mode), `docs/OPEN-ISSUES.md` updated.
- Deploy to Vercel with `NEXT_PUBLIC_DEMO_MODE=true`; rehearse the §17.5 demo on a mid-range Android phone.

### 3G. Stretch (Phase 3, only once 3A to 3F pass)
T3.1 Web Push + cron, T3.3 Bhashini languages and TTS, T3.4 pySTEPS nowcast service, T3.5 Mitra LLM rephrase, T3.6 radar overlay, T3.7 district polygons, T3.8 dark mode, T3.9 site search.

**Exit criteria (= PRD Definition of Done, §22.4)**
- ≥ 250 tests pass; build passes; no ESLint errors in touched files.
- Sky Snap and Jal-Bharav under 700 ms per photo on a mid-range Android; tensors do not leak across 10 analyses.
- Every on-screen number has a source and time; every estimate and demo value is labelled.
- Deployed, documented, and the 7-minute demo runs end to end.

### Part 3 status: built and verified locally, not deployed (1 Oct 2026)

Done and checked:

- **Quality checks:**
  - 305 tests pass; `npm run lint` has no errors in `src`; `npm audit` reports 0 vulnerabilities.
  - `npm run check:browser` passes on all 34 routes: no serious or critical axe issues; 320 px reflow at 100% and at 200% text with high contrast; no raw keys; no console or CSP errors.
  - Lighthouse mobile (median of 3, demo build): Home Performance 80 and Accessibility 100. Alerts 81 and Onboarding 82. Best Practices and SEO are 100.
  - The service worker was checked offline: visited pages load, unvisited pages show `/offline`, and the weather falls back to the copy saved on the device.
- **3A:** reports, votes, export and feedback, with rate limits, location-jump rejection and community verification. The `/reports` page, waterlogging widget and home teaser are live, and the commute and school-run cards use trusted reports.
- **3B:**
  - CameraCapture, `/sky-snap` and `/report` are built.
  - The Dhundh Meter works without a model.
  - The TF.js loader is a dynamic import, so it is never on the homepage.
- **3C:**
  - Mitra covers all 24 intents plus greeting, thanks and language switch, in EN, HI and Hinglish.
  - The safety check runs first; voice in and out works; the panel loads on first open.
  - There are 135 utterance tests, and end-to-end replies are tested on all six scenarios.
- **3D:** `/map` (layers plus a list view), `/ready` (habits, kits, 11 badges), and `/learn` (12 bilingual articles, myths quiz, lightning check). The legacy SaathiSync tracker, profile, SheFit and wellness code is removed.
- **3E:**
  - All GIGW pages, the manifest, sitemap and robots, new app icons, the service worker and install card, and security headers.
  - The feedback email is optional and needs consent.
- **3F:**
  - Edge cases E8, E16, E19 and E22 are fixed.
  - The layout-shift fixes include docking the alert ribbon at the bottom (Home CLS went from 0.95 to 0.03).
  - Font Awesome is subset (CSS 69 KB to 11 KB, fonts 300 KB to 19 KB), CSS is inlined, Hindi loads on demand, and the weather request starts from `<head>`.
  - The README and OPEN-ISSUES are updated.

Not met or not done (details in [OPEN-ISSUES](OPEN-ISSUES.md)):

- **No trained Sky Snap or Jal-Bharav model.** The dataset licences need checking first. Both features run a labelled manual path, so the 700 ms and tensor-leak criteria are unmeasured.
- **The first-load JS budget of 200 KB is not met.** Home is about 300 KB gzipped, and the framework alone is about 153 KB. The Lighthouse targets are met.
- **Not deployed to Vercel.** It needs the team's account.
- **Not rehearsed on a mid-range Android phone.**
- **No Hindi review by a fluent speaker.**
- **Stretch (3G) not started:** Postgres, push notifications, Bhashini, the pySTEPS nowcast service, the radar overlay, district polygons and site search.

---

## Open questions to settle before Part 1 (PRD §17.7 defaults in brackets)
1. IMD API access for SIH teams? (Assume no; build behind flags.)
2. Postgres available for the demo? (Else memory + seeded fixtures.)
3. Which 3 extra languages to showcase? (Tamil, Bengali, Marathi.)
4. Cool-spot cities? (Delhi, Ahmedabad, Lucknow.)
5. Keep optional login? (Yes, hidden in Settings.)
