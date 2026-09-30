# Open issues and deferred blockers

Recorded against commit `027ffba` plus the prohibition-fix work. These are
things that cannot be closed from inside this repository, or that were
deliberately left out of scope. Keep this file current.

## Blockers

### 1. Admin registration is open on the backend

The public `/adminregister` route has been deleted from this app, so there is
no longer a visible signup page. **That is not the fix.** The real control
point is `POST /api/admin/register` on `sih24-backend.onrender.com`, which is
not in this repository.

That endpoint was deliberately **not** probed, because a successful request
would create a real admin account on a live system. Someone with backend
access must verify whether it accepts unauthenticated registrations and close
it if so.

Admin accounts should be provisioned out of band until that is confirmed.
`/adminlogin` and `/dashboard` are untouched and still work.

### 2. The Python recommender checkpoint is missing

The architecture brief's Build 2 depends on an existing Python recommendation
prototype, reported as 18 catalogue records and 210 passing tests. No Python
artifacts exist anywhere in this repository: no `.py` files, no
`requirements.txt`, no `master_report.json`, no checkpoint archive.

Build 2 cannot start until that checkpoint is supplied and audited.

### 3. Database ownership is undecided

The `/api/v1` boundary now exists and reads and writes through the repository
contract in `src/server/repositories/types.js`, but its only implementation is
in-memory. Data is lost on restart, on redeploy, and independently per
serverless instance. `GET /api/v1/health` reports this as
`persistence.durable: false`.

Choosing a store and authorising credentials is the remaining blocker. Until
then the following stay unimplemented rather than being built on a store that
forgets: cycle history, habit history beyond the current process, the reward
ledger, saved recipes, recommendation sessions, and data export or deletion.

Swapping in a durable adapter should be one new module plus one branch in
`src/server/repositories/index.js`, with no endpoint or domain service
changing. See `contracts/api-v1.md`.

## Known unfixed issues

### Fabricated content still in the UI

Dashboard figures on Home and Profile are now marked with a "Sample data"
badge and centralised in `src/data/demoStats.js`, but they remain fabricated.
Two larger cases were left alone because they are static markup needing a
design decision rather than a substitution:

- The eight-item appointment inbox on the profile.
- The profile calendar, hardcoded to September 2024 with fixed appointments.

### Unverified venue data

`tennis-venues.js` and `meditation-venues.js` list real-looking names,
addresses, phone numbers and ratings for Delhi-area venues. None of it has
been verified. Either verify it or label it clearly as illustrative.

### Hotlinked third-party images

Eighteen images are hotlinked from an unrelated public GitHub repository, plus
others from CNN, India Today, WFLA and similar. These can break or be blocked
at any time and were not licensed for this use.

### Seven activity tiles have no destination

Running, cycling, climbing, hiking, dancing, gardening and swimming render as
plain tiles because no pages exist. Building them needs real venue data.

### Correctness bugs reviewed but not fixed

- `calorie.js` computes BMR from a hardcoded height and weight that the form
  never collects, so every result is wrong.
- `Yoga.js` never clears its 100ms detection interval on unmount and never
  disposes TensorFlow tensors, leaking on every visit.
- `PostList.js` mutates state through a shallow copy.

### Lint findings (10 pre-existing)

`npm run lint` now works. It calls ESLint directly, because `next lint` was
removed in Next.js 16, and uses the flat config in `eslint.config.mjs`.

It reports 8 errors and 2 warnings, all in code that predates this work. The
rules were left at their default severity rather than downgraded, so the run
exits non-zero. That is accurate: these are real findings, not noise to be
silenced.

| Rule | Count | Notes |
|---|---|---|
| `react-hooks/set-state-in-effect` | 7 | setState called synchronously inside an effect. The two calendars that did this were fixed by deriving with `useMemo`; the rest are in the auth context and the camera screen and need real reworking |
| `react-hooks/globals` | 1 | `Yoga.js` reassigns the module-scope `interval` during render |
| `react-hooks/exhaustive-deps` | 1 | `Yoga.js` effect missing `bestPerform` and `startingTime` |
| `import/no-anonymous-default-export` | 1 | The mediapipe shim |

Everything under `src/server/`, `src/app/api/`, the error boundaries and the
rebuilt About page lints clean.
