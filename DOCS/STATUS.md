# RevLog — Development Status

**Last updated:** 2026-04-05
**Current phase:** Phase 4 complete — Phase 5 next

---

## Phase 1 — MVP (Core Loop) ✅ COMPLETE

**Completed:** 2026-03-30

### What was built

| Workstream                          | Status | Key files                                                                                                             |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| WS-0: Auth foundation               | ✅     | `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/auth-utils.ts`, `src/proxy.ts`, `src/app/(auth)/`                    |
| WS-1: Car CRUD & Garage             | ✅     | `src/lib/actions/car.ts`, `src/app/(main)/garage/`, `src/components/garage/car-*`                                     |
| WS-2: Event CRUD & List             | ✅     | `src/lib/actions/event.ts`, `src/app/(main)/events/`, `src/components/events/`                                        |
| WS-3: Shell layout & nav            | ✅     | `src/app/(main)/layout.tsx`, `src/components/layout/`, `src/app/(main)/settings/`                                     |
| WS-4: Maintenance log & alerts      | ✅     | `src/lib/actions/maintenance.ts`, `src/app/(main)/garage/[carId]/maintenance/`, `src/components/garage/maintenance-*` |
| WS-5: Dashboard                     | ✅     | `src/lib/queries/dashboard.ts`, `src/app/(main)/dashboard/`, `src/components/dashboard/`                              |
| WS-6: Distance calc + Calendar sync | ✅     | `src/lib/services/geocode.ts`, `src/lib/services/distance.ts`, `src/lib/services/calendar-sync.ts`                    |

### Packages added in Phase 1

- `bcryptjs` + `@types/bcryptjs`
- `@auth/prisma-adapter`

### shadcn/ui components installed in Phase 1

card, input, label, select, dialog, separator, badge, dropdown-menu, calendar, popover, command, textarea, switch, tabs, sheet, avatar, tooltip, scroll-area, form, progress

### Key decisions made

- Prisma 7 uses direct `PrismaClient()` — no `@prisma/adapter-pg` needed
- Google integrations (Maps, Calendar) are env-gated stubs — no-op without credentials
- `proxy.ts` used (not `middleware.ts` — deprecated in Next.js 16)
- `useActionState` from `react` (not deprecated `useFormState` from `react-dom`)
- Deployment target: Dokploy VPS with Docker Compose
- No Supabase — plain Postgres only

### Post-review fixes applied

- All `update`/`delete` mutations atomically scoped by `userId` (TOCTOU fix)
- `updateEventStatus` validates status against allowlist before DB write
- `updateProfile` lat/lng logic corrected
- `buildCalendarDescription` deduplicated into single export from `actions/event.ts`

---

## Phase 2 — Garage & Tracking ✅ COMPLETE

**Completed:** 2026-03-30

### Pre-work

- Schema migration `20260330200024_make_adjusted_time_nullable`: `Run.adjustedTime` is now `Float?`
- Packages installed: `cheerio`, `jszip`, `@types/cheerio`

### Workstreams

| Workstream                             | Status | Key files                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WS-7: Foundation (constants/utils/val) | ✅     | `src/lib/constants/mod-categories.ts`, `src/lib/constants/wishlist-priorities.ts`, `src/lib/constants/run-conditions.ts`, `src/lib/constants/penalty-types.ts`, `src/lib/validations/mod.ts`, `src/lib/validations/wishlist.ts`, `src/lib/validations/run.ts`, `src/lib/utils/penalty-calc.ts`, `src/lib/utils/consistency.ts` |
| WS-8: Modifications log                | ✅     | `src/lib/actions/mod.ts`, `src/lib/queries/mods.ts`, `src/app/(main)/garage/[carId]/mods/`, `src/components/garage/mod-form.tsx`, `src/components/garage/mod-list.tsx`                                                                                                                                                         |
| WS-9: Upgrades wishlist                | ✅     | `src/lib/actions/wishlist.ts`, `src/lib/queries/wishlist.ts`, `src/app/(main)/garage/[carId]/wishlist/`, `src/components/garage/wishlist-form.tsx`, `src/components/garage/wishlist-list.tsx`                                                                                                                                  |
| WS-10: Times tracker (Run CRUD)        | ✅     | `src/lib/actions/run.ts`, `src/lib/queries/runs.ts`, `src/app/(main)/times/page.tsx`, `src/app/(main)/events/[eventId]/runs/`, `src/components/times/run-form.tsx`, `src/components/times/run-list.tsx`                                                                                                                        |
| WS-11: Event session view              | ✅     | `src/app/(main)/events/[eventId]/session/page.tsx`, `src/components/times/session-summary.tsx`, `src/components/times/session-run-table.tsx`                                                                                                                                                                                   |
| WS-12: Calendar view                   | ✅     | `src/app/(main)/events/calendar/page.tsx`, `src/components/events/calendar-view.tsx`                                                                                                                                                                                                                                           |
| WS-13: URL paste / auto-fill           | ✅     | `src/lib/services/motorsportreg-scraper.ts`, `src/lib/actions/scrape.ts`, `src/components/events/url-autofill.tsx`                                                                                                                                                                                                             |
| WS-14: CSV export                      | ✅     | `src/lib/services/csv-export.ts`, `src/app/api/export/[section]/route.ts`, `src/app/api/export/bundle/route.ts`, `src/components/shared/export-button.tsx`, `src/components/shared/export-all-button.tsx`                                                                                                                      |

### Scope

- [x] Modifications log (13 categories, total cost display)
- [x] Upgrades wishlist with priority + "Move to Mods" action
- [x] Times tracker (run logging, adjusted time, penalty calculation)
- [x] Event session view (best run highlight, consistency meter)
- [x] Calendar view for events (month grid, color-coded chips)
- [x] URL paste / auto-fill for events (MotorsportReg Cheerio parser)
- [x] CSV export (per-section, zip bundle for multiple)

### Packages added in Phase 2

- `cheerio` + `@types/cheerio`
- `jszip`

### shadcn/ui components added in Phase 2

- `checkbox` (run form DNF toggle)

### shadcn/ui components added in Phase 2

- `checkbox` (added for WS-10 RunForm DNF toggle)

### Resolved decisions

- Penalty JSON structure: `Array<{ type: string; count: number; secondsEach: number }>`
- DNF runs: `adjustedTime` is `null` (hence nullable migration above)

---

## Phase 3 — Analytics & Polish ✅ COMPLETE

**Completed:** 2026-03-31

### Pre-work

- ✅ Schema migration `20260331191406_pre_phase3_indexes_is_dnf_drop_penalty_defaults`: indexes, `Run.isDnf`, dropped `PenaltyDefault`
- ✅ Schema migration `20260331194048_add_maintenance_audit`: `MaintenanceAudit` model

### Scope

- [x] Performance analytics (progress charts, personal records, car comparison)
- [x] Consistency scoring (std dev of adjusted times)
- [x] Conditions analysis (best times by weather tags)
- [x] Season progress widget + Recent runs widget (dashboard)
- [x] Maintenance snooze + audit trail
- [x] Additional costs per event (UI — model already existed)
- [x] Generic URL scraper (direct fetch + Cheerio, Schema.org/OpenGraph)

### Workstreams

| Workstream                        | Status | Key files                                                                                                                                                                                                                                             |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-15: Schema migration           | ✅     | `prisma/schema.prisma`, `prisma/migrations/20260331194048_*`                                                                                                                                                                                          |
| WS-16: Analytics query layer      | ✅     | `src/lib/queries/analytics.ts`, `src/types/analytics.ts`                                                                                                                                                                                              |
| WS-17: Analytics page + charts    | ✅     | `src/app/(main)/times/layout.tsx`, `src/app/(main)/times/analytics/`, `src/components/times/times-nav.tsx`, `src/components/analytics/progress-chart.tsx`, `conditions-chart.tsx`, `car-comparison-chart.tsx`, `pr-table.tsx`, `consistency-card.tsx` |
| WS-18: Dashboard widgets          | ✅     | `src/components/dashboard/season-progress-widget.tsx`, `src/components/dashboard/recent-runs-widget.tsx`, `src/app/(main)/dashboard/page.tsx`                                                                                                         |
| WS-19: Maintenance snooze + audit | ✅     | `src/lib/actions/maintenance.ts`, `src/lib/validations/maintenance-snooze.ts`, `src/components/garage/maintenance-snooze-button.tsx`, `maintenance-alert-banner.tsx`, `maintenance-alert-card.tsx`, `maintenance-list.tsx`                            |
| WS-20: Additional costs UI        | ✅     | `src/lib/actions/additional-cost.ts`, `src/lib/validations/additional-cost.ts`, `src/components/events/additional-costs-section.tsx`, `src/app/(main)/events/[eventId]/page.tsx`                                                                      |
| WS-21: Generic URL scraper        | ✅     | `src/lib/services/generic-event-scraper.ts`, `src/lib/actions/scrape.ts`, `src/components/events/url-autofill.tsx`                                                                                                                                    |

### Packages added in Phase 3

_(none — Recharts was already installed)_

### Key decisions made

- Analytics at `/times/analytics` (tab under Times) — avoids 6th nav item on mobile
- No Firecrawl: generic scraper uses direct `fetch` + Cheerio with Schema.org/OpenGraph heuristics
- `MaintenanceAudit` records snooze/unsnooze events; audit trail UI deferred to a future phase
- `AdditionalCost` ownership always verified through `Event.userId` join (model has no direct `userId`)

---

## Phase 4 — Ship It ✅ COMPLETE

**Completed:** 2026-03-31

### Scope

- [x] Docker Compose packaging for Dokploy VPS deployment
- [x] `.env.example` + deployment documentation
- [x] `DISABLE_REGISTRATION` env flag for personal/friends use
- [x] PWA support (add-to-homescreen, asset caching)
- [x] Basic self-host README

### Workstreams

| Workstream                     | Status | Key files                                                                                                                                                                                        |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WS-22: Dockerfile + standalone | ✅     | `Dockerfile`, `.dockerignore`, `docker/entrypoint.sh`, `next.config.ts`                                                                                                                          |
| WS-23: DISABLE_REGISTRATION    | ✅     | `src/lib/actions/auth.ts`, `src/lib/auth.ts`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/components/auth/register-form.tsx`, `src/components/auth/login-form.tsx` |
| WS-24: PWA                     | ✅     | `src/app/manifest.ts`, `src/app/sw.ts`, `src/app/layout.tsx`, `public/icon-*.png`                                                                                                                |
| WS-25: Production Compose      | ✅     | `docker-compose.prod.yml`                                                                                                                                                                        |
| WS-26: Docs                    | ✅     | `.env.example`, `README.md`                                                                                                                                                                      |

### Packages added in Phase 4

- `@serwist/next` + `serwist` (PWA / service worker)

### Key decisions made

- Serwist used for PWA (Workbox-based, actively maintained, Next.js App Router support)
- Service worker disabled in development (`NODE_ENV === "development"`)
- `DISABLE_REGISTRATION` gates: server action, Google OAuth `signIn` callback, and `/register` page redirect
- `docker/entrypoint.sh` runs `prisma migrate deploy` before `node server.js`
- Production compose uses `depends_on: condition: service_healthy` to wait for Postgres

---

## Phase 4.5 — Polish & Deploy ✅ COMPLETE

**Completed:** 2026-04-01

### Scope

- [x] Auth env-gating: Google OAuth provider conditionally registered; Google button hidden when creds absent
- [x] `AUTH_TRUST_HOST` / `AUTH_URL` documented in `.env.example` (required behind Dokploy reverse proxy)
- [x] Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy
- [x] Health check endpoint at `/api/health` (DB ping, no auth required)
- [x] Settings/Appearance page: theme toggle (dark/light/system)
- [x] Settings/Penalties page: static reference for default 2s/cone penalty
- [x] Error boundary at `(main)` layout level
- [x] Custom 404 page
- [x] Loading skeletons for Times, Car detail, Settings
- [x] Toast feedback on car form and maintenance form/delete
- [x] Confirmation dialogs on run delete and wishlist delete (prevent accidental mobile taps)
- [x] Back links on event detail, car detail, all settings sub-pages
- [x] Delete Car button on car detail page (action existed but had no UI)
- [x] Visual consistency: heading weights, title casing, form container padding, font-mono CSS fix, apple-touch-icon

### Deployment method

Dokploy VPS with Nixpacks auto-build (not Docker). Set `AUTH_URL` and `AUTH_TRUST_HOST=true` in Dokploy env config.

---

## Phase 4.7 — UX Polish ✅ COMPLETE

**Completed:** 2026-04-04

### Scope

- [x] Run form session memory — conditions/penalties/tireSetup inherited from previous run after run 1
- [x] "New Personal Best!" toast when a created run beats the user's car+event-type best
- [x] Bottom sheet + sticky FAB for run entry on session page (no more full-page navigation)
- [x] Context-aware consistency display — Autocross labels best as "Result" (only time that counts), RallyCross shows cumulative time + prominent consistency
- [x] After-session narrative — plain-English summary below session stats (PB delta, clean session, improvement trend)
- [x] Venue history — "Your History at [Venue]" section on session page, showing all past events at the same venue with best times and delta
- [x] Dashboard shows next 3 upcoming events instead of 1 (new `UpcomingEventsCard`)
- [x] "Race Ready / Maintenance Due / Not Race Ready" status badge on car detail header
- [x] Mod timeline on progress chart — dashed vertical lines at mod install dates
- [x] Improved empty states: Times page, analytics page, dashboard widgets, session page

### New files

- `src/components/times/add-run-sheet.tsx` — Sheet + FAB wrapper
- `src/components/times/session-narrative.tsx` — Plain-English session summary
- `src/components/times/venue-history.tsx` — Venue history display
- `src/components/dashboard/upcoming-events-card.tsx` — Multi-event dashboard card
- `src/lib/queries/venue-history.ts` — Venue history query

### Key decisions

- Session memory passes `conditions`, `penalties`, `tireSetup` without `id` (avoids triggering edit mode in RunForm)
- PB detection queries after `createRun` using car + event type scope; first non-DNF run at a type always fires `isPB: true`
- Consistency de-emphasized for Autocross (shows "informational" label), prominently shown for RallyCross with cumulative time
- Venue history matches on exact `venueName` string equality (typo normalization deferred)
- `revalidatePath('/events/${eventId}/session')` added to `createRun` so sheet close refreshes run list

---

## Phase 4.8 — Event Intake Improvements ✅ COMPLETE

**Completed:** 2026-04-05

### Scope

- [x] MSR scraper extracts `startTime` / `endTime` from ISO datetime attributes
- [x] MSR scraper improved fee extraction (`[itemprop="price"]`, `meta[itemprop="lowPrice"]`)
- [x] MSR scraper adds registration deadline extraction (`[itemprop="doorTime"]`, close-text heuristic)
- [x] Generic scraper extracts `startTime` / `endTime` from JSON-LD datetime strings
- [x] Event form autofill wires up `startTime` / `endTime` from scraper results
- [x] MSR org calendar bulk import — paste org URL → browse events → select → bulk create
- [x] Deduplication by `registrationUrl` (already-imported events greyed out)
- [x] "Import" button added to events list header

### New files

- `src/lib/services/motorsportreg-api.ts` — MSR org calendar API client + type mapping
- `src/lib/actions/import.ts` — `fetchOrgEvents` + `bulkCreateEvents` server actions
- `src/app/(main)/events/import/page.tsx` — Import page (server component)
- `src/components/events/org-import.tsx` — Two-step import UI (client component)

### Key decisions

- Bulk import skips geocoding to avoid rate-limiting; users trigger it by editing events
- MSR org calendar API used unauthenticated (`/rest/calendars/organization/{id}.json`); gracefully returns error on auth failure
- Deduplication key: `registrationUrl` (stable MSR URL per event, already stored on Event model)
- No schema changes needed — all required fields already exist on the Event model

---

## Phase 4.9 — Garage Overhaul (WS-B: Brake Tracking) ✅ COMPLETE

**Completed:** 2026-04-10

### Scope

- [x] WS-B: Brake set tracking — full CRUD, heat cycles, wear status, run history, maintenance history

### Workstreams

| Workstream           | Status | Key files                                                                                                                                                                                                                                                                                 |
| -------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-B: Brake tracking | ✅     | `src/lib/constants/brake-positions.ts`, `src/lib/validations/brake-set.ts`, `src/lib/actions/brake-set.ts`, `src/lib/queries/brake-sets.ts`, `src/components/garage/brake-set-form.tsx`, `brake-set-list.tsx`, `brake-set-detail.tsx`, `src/app/(main)/garage/[carId]/brakes/` (5 routes) |

### New files

- `src/lib/constants/brake-positions.ts` — `BRAKE_POSITIONS` as const tuple; `BrakePosition` type
- `src/lib/validations/brake-set.ts` — `createBrakeSetSchema` + `updateBrakeSetSchema` (zod); reuses `TIRE_STATUSES` for status enum
- `src/lib/actions/brake-set.ts` — `createBrakeSet`, `updateBrakeSet`, `deleteBrakeSet`, `incrementBrakeHeatCycles` server actions
- `src/lib/queries/brake-sets.ts` — `getBrakeSetsForCar` (grouped Active/Stored/Retired, Front-first order), `getBrakeSetDetail` (with runs + brake maintenance history)
- `src/components/garage/brake-set-form.tsx` — Form with position, status, pad brand/compound, rotor brand/notes, wear %, purchase date, cost, notes
- `src/components/garage/brake-set-list.tsx` — Grouped by status, card grid with `WearBar` (red/yellow/green), heat cycle count, dropdown (Edit, +1 Heat Cycle, Delete with AlertDialog)
- `src/components/garage/brake-set-detail.tsx` — Header with +1 Heat Cycle button, Specs card, Wear Status card (large % indicator), Run History, Brake Maintenance History
- `src/app/(main)/garage/[carId]/brakes/page.tsx` — List page
- `src/app/(main)/garage/[carId]/brakes/loading.tsx` — Skeleton loading state
- `src/app/(main)/garage/[carId]/brakes/new/page.tsx` — Create form
- `src/app/(main)/garage/[carId]/brakes/[brakeSetId]/page.tsx` — Detail page
- `src/app/(main)/garage/[carId]/brakes/[brakeSetId]/edit/page.tsx` — Edit form

### Key decisions

- Reused `TIRE_STATUSES` (Active/Stored/Retired) for brake status — same lifecycle semantics
- `wearRemaining` is nullable — "Not measured" shown instead of a bar when null
- Wear color thresholds: <20% red (critical), 20–50% yellow (moderate), >50% green (good)
- Inline `WearBar` using `style` for dynamic color (shadcn `Progress` doesn't accept `indicatorClassName`)
- Maintenance history on detail page fetches `serviceType IN ["Brake Pads", "Brake Rotors"]` for the same car
- `incrementBrakeHeatCycles` revalidates the detail page path; create/update/delete revalidate the list path
- All ownership checks use `findFirst` with `car: { userId }` join pattern (matching spec)

---

## Phase 4.9 — Garage Overhaul (WS-D: Expense Tracking) ✅ COMPLETE

**Completed:** 2026-04-10

### Scope

- [x] WS-D: Per-car expense tracking — full CRUD, charts, CSV export

### Workstreams

| Workstream             | Status | Key files                                                                                                                                                                                                                                                                |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WS-D: Expense tracking | ✅     | `src/lib/constants/expense-categories.ts`, `src/lib/validations/expense.ts`, `src/lib/actions/expense.ts`, `src/lib/queries/expenses.ts`, `src/components/garage/expense-form.tsx`, `expense-list.tsx`, `expense-summary.tsx`, `src/app/(main)/garage/[carId]/expenses/` |

### New files

- `src/lib/constants/expense-categories.ts` — 7 categories as const tuple
- `src/lib/validations/expense.ts` — `createExpenseSchema` + `updateExpenseSchema` (zod)
- `src/lib/actions/expense.ts` — `createExpense`, `updateExpense`, `deleteExpense` server actions
- `src/lib/queries/expenses.ts` — `getExpensesForCar`, `getExpenseSummary` (JS aggregation: allTime, currentYear, byCategory, byMonth)
- `src/components/garage/expense-form.tsx` — Category/date/amount/vendor/description/receiptUrl/notes form
- `src/components/garage/expense-list.tsx` — Client component with category filter + delete confirmation dialog
- `src/components/garage/expense-summary.tsx` — Stat cards + horizontal BarChart (by category) + LineChart (12-month trend)
- `src/app/(main)/garage/[carId]/expenses/page.tsx` — Main expenses page
- `src/app/(main)/garage/[carId]/expenses/loading.tsx` — Skeleton loading state
- `src/app/(main)/garage/[carId]/expenses/new/page.tsx` — New expense page
- `src/app/(main)/garage/[carId]/expenses/[expenseId]/edit/page.tsx` — Edit expense page

### CSV export extended

- `expensesToCSV()` added to `src/lib/services/csv-export.ts`
- `expenses` case added to `src/app/api/export/[section]/route.ts`

### Pre-existing test fix

- `src/lib/services/csv-export.test.ts` — Updated Mod fixtures to include `receiptUrl: null` (Mod schema was extended in a previous phase; test was stale)

### Key decisions

- Monthly aggregation uses JS/TS (fetch all, aggregate in-memory) — appropriate at this scale, avoids raw SQL
- `getExpenseSummary` returns both `expenses` and `summary` in a single call to avoid waterfall on the page
- `byMonth` always returns 12 entries (oldest → newest) with 0 for months with no spend
- Ownership verified via `car: { userId }` join on `Expense.findFirst` (matching the spec pattern)
- Export button wired with existing `ExportButton` component (`section="expenses"`)

---

## Phase 5 — Open Source Prep ⏳ NOT STARTED

### Pre-work required before starting

- Schema migration: add `CarPhoto` model

### Scope

- [ ] Multi-stage Dockerfile, clean Docker Compose for public consumption
- [ ] MinIO option for self-hosted file storage
- [ ] Photo uploads (R2 / S3-compatible abstraction)
- [ ] Additional calendar providers (Apple CalDAV, Outlook Graph API)
- [ ] Comprehensive self-host documentation for public users
- [ ] MotorsportReg API integration (contingent on API access)

---

## Phase 6 — Monetization ⏳ NOT STARTED — NO TIMELINE

> **Note:** Do not work on Phase 6 until explicitly decided. This phase has no timeline and should not influence architecture decisions in earlier phases.

### Pre-work required before starting

- Schema migrations: `Subscription` model, `User.tier` field
- Billing provider decision (Stripe vs Lemon Squeezy)
- Paid tier feature matrix (what is free vs paid)

### Scope

- [ ] Billing provider integration
- [ ] Subscription model
- [ ] Paid tier feature gating
- [ ] Hosted tier infrastructure

---

## Phase 7 — Telemetry Import ⏳ NOT STARTED — NO TIMELINE

> **Note:** No lap timing app has a REST API — integration is file upload + parsing only. Do not work on Phase 7 until explicitly decided.

### Tier 1 (MVP) — Lap Time Import

Upload exported session files → parse → auto-create Runs (and Event if no match).

- **Parsers:** VBO (covers all major apps), RaceChrono CSV v3, generic CSV with column mapping
- **Import flow:** Upload → detect format → preview laps → match/create Event + Car → confirm → bulk-create Runs
- **Schema changes:** `Run.sectorTimes Float[]`, `Run.importSource String?`
- Supported sources: RaceChrono, Harry's LapTimer, TrackAddict, VBOX hardware

### Tier 2 — GPS Trace Storage & Track Maps

- New `GpsTrace` model: JSON array of `{t, lat, lon, speed, heading}` per Run
- GPX parser; extend VBO/CSV parsers to extract GPS columns
- Track map: driving line color-coded by speed (Leaflet or Mapbox — TBD, see Open Questions)
- Lap comparison overlay (two laps on same map)

### Tier 3 — OBD2 / Telemetry Channels

- OBD2 channels: RPM, throttle %, coolant temp, engine load
- Time-series charts (Recharts) synced to track map position
- Higher storage volume — may require compression or partitioned storage

---

## Open Questions

| #   | Question                                               | Blocking                                                               |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | MotorsportReg API availability (authenticated)         | Phase 5 (unauthenticated org calendar already integrated in Phase 4.8) |
| 2   | PWA depth: promote to full offline sync queue?         | Phase 5                                                                |
| 3   | Mapping library for GPS track maps (Leaflet vs Mapbox) | Phase 7 Tier 2                                                         |

---

## Resolved Decisions

| #   | Question                  | Decision                                                                                         | Phase   |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------ | ------- |
| 2   | PWA depth                 | Basic caching only in Phase 4. Full offline sync queue deferred to Phase 5 as a maybe            | Phase 4 |
| 3   | Tire log                  | First-class entity — tires get their own section in the app, not maintenance log entries         | Phase 3 |
| 4   | Billing provider          | Lemon Squeezy (merchant of record, simpler for indie/international)                              | Phase 6 |
| 5   | Paid tier model           | Storage gating only — free users get full app, paid unlocks photo uploads                        | Phase 6 |
| 6   | Video on runs             | Out of scope permanently. Photo upload for car profile only (one image)                          | Phase 5 |
| 7   | Co-driver / team support  | Cut entirely — not needed for target use case                                                    | —       |
| 8   | Telemetry import approach | File upload + parsing only — no lap timing app (RaceChrono, Harry's, TrackAddict) has a REST API | Phase 7 |

---

## Schema Change Log

| Migration                                    | Phase          | Description                                                                                                                  |
| -------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `20260330174150_init`                        | Pre-Phase 1    | Initial schema: User, Account, Session, Car, Mod, WishlistItem, MaintenanceEntry, Event, AdditionalCost, Run, PenaltyDefault |
| `20260330200024_make_adjusted_time_nullable` | Phase 2        | Make `Run.adjustedTime` nullable (`Float?`)                                                                                  |
| _(pending)_                                  | Before Phase 3 | Add `MaintenanceAudit` model                                                                                                 |
| _(pending)_                                  | Before Phase 5 | Add `CarPhoto` model                                                                                                         |
| _(pending)_                                  | Before Phase 6 | Add `Subscription` model, `User.tier` field                                                                                  |
