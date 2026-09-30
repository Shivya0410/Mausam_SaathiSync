# Mausam Saathi API (`/api/mausam/*`)

PRD section 13.3. All routes are public and anonymous: personalisation happens
on the device, so the server never needs to know who is asking.

## Conventions

- **Coordinates** are rounded to 2 decimals (about 1.1 km) before use. Exact
  locations never reach upstream providers.
- **Caching.** GET routes returning non-personal data send
  `Cache-Control: public, s-maxage=<n>, stale-while-revalidate=<m>`. Errors
  and `/health` send `no-store, private`.
- **Errors** use the `/api/v1` shape, with a request id on every response
  (`X-Request-Id` header):

  ```json
  { "error": { "code": "validation_failed", "message": "...", "details": { "fields": { "lat": "is required" } }, "requestId": "..." } }
  ```

  Unknown query parameters are rejected (422), and every bad field is reported
  at once.
- **Times** are ISO 8601 with the place's UTC offset
  (`2026-09-30T14:00:00+05:30`).

## GET /api/mausam/snapshot

| Param | Required | Notes |
|---|---|---|
| `lat`, `lon` | yes | rounded to 2 decimals |
| `include` | no | comma list of `air`, `marine`, `warnings`, `sun`, `soil`. Default `air,warnings,sun` |
| `lang` | no | `en` (default) or `hi` (CAP text language when available) |
| `name`, `district`, `state` | no | place labels the client already has from search (max 80 chars). They improve warning matching |
| `demo` | no | demo scenario id (see below) |

Returns a `WeatherSnapshot` (`src/lib/mausam/types.js`), including:

- `hourly`: past 12 h plus next 48 h. `daily`: 16 days.
- `air`: `method` is `cpcb`, `computed` (estimated from model PM data) or
  `fixture`. It is `null` when unavailable.
- `warnings`: official warnings **for this place**. `regionalWarnings`: same
  state, other districts (Alerts page only, never cards or the ribbon).
- `warningsStatus`:
  - `ok`: every official source answered.
  - `partial`: some sources answered.
  - `unavailable`: none answered. The UI must say "Couldn't check official
    warnings", **never** "No warnings".
  - `not_applicable`: outside India.
  - `not_requested`.
- `isDemo`: true whenever any fixture was used. `stale`: true when served
  from cache after an upstream failure.

Cache: `s-maxage=300`.

## GET /api/mausam/warnings

`lat`, `lon`, optional `district`, `state`, `lang`. Returns
`{ warnings, regionalWarnings, warningsStatus, checkedAt }`. It never falls
back to fixtures. Cache: `s-maxage=120`.

## GET /api/mausam/air

`lat`, `lon`. Returns `{ air, isDemo }`. Cache: `s-maxage=900`.

## GET /api/mausam/marine

`lat`, `lon`. Returns `{ marine, status }`. `status` is `ok`,
`not_available` (inland) or `unavailable` (upstream failed).
`marine.tides` is empty when the sea level is not available; tide times are
never guessed.

## GET /api/mausam/airport

`icao`: 1 to 4 comma-separated ICAO codes (`VIDP,VABB`). Returns
`{ airports: [{ icao, metar: { visibilityM, weather: ['FG'], words, windKmh, observedAt, raw }, taf: { fog, mist, thunderstorm, minVisibilityM, raw } }] }`.
This is airport weather, not flight status. Cache: `s-maxage=300`.

## GET /api/mausam/climatology

`lat`, `lon`, `month`, `day`, optional `window` (0 to 7, default 3) and
`years` (3 to 20, default 10). Returns
`{ yearsCounted, rainyYears, typicalMaxC, typicalMinC, typicalGustKmh }`.
A "rainy year" is at least 2.5 mm on any day in the window. The data is
"based on past years, not a forecast". Cache: one day.

## GET /api/mausam/places/search

`q` (2 to 80 characters), `lang`. Returns `{ results, source }`, India
first. Each result has `id, name, admin1, admin2, country, countryCode, lat,
lon, population, featureCode`.

Numeric queries (PIN codes) return `results: []` with `hint: 'place_name'`,
because the geocoder does not resolve PINs. If the geocoder is down, the 12
bundled quick-pick cities are searched (`source: 'bundled'`).

## GET /api/mausam/health

Reports which providers are configured, per-provider counters for the last
hour (requests, errors, p50 and p95 latency), and the persistence adapter. It
contains no keys or upstream URLs.

## Demo scenarios

`delhi-winter-smog-fog`, `mumbai-monsoon-red`, `chennai-cyclone`,
`lucknow-heatwave`, `punjab-village-frost`, `goa-swell-alert` (PRD section 24).

- Times are generated relative to now.
- Fixture warnings say "(Demo of IMD warning format)" in their text.
- `FORCE_FIXTURES=true` serves fixture weather for any coordinates, while
  warnings report `unavailable`.

## Data sources (verified 30 Sep 2026)

| Source | Status |
|---|---|
| Open-Meteo forecast, air quality, marine, archive, geocoding | Live, no key. `sea_level_height_msl` works on Indian coasts. Hindi place names resolve |
| NDMA SACHET CAP | Live, public RSS plus CAP 1.2 |
| aviationweather.gov METAR/TAF | Live, no key. `visib` is in statute miles, so metres are read from the raw report |
| IMD API | Requires IP whitelisting (HTTP 401 otherwise). Adapter built to the published reference; off by default |
| CPCB via data.gov.in | Needs a free key. Resource id to verify |
