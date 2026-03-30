# RevLog — Development Status

**Last updated:** 2026-03-30  
**Current phase:** Phase 1 complete, Phase 2 not started

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

## Phase 2 — Garage & Tracking ⏳ NOT STARTED

### Pre-work required before starting

```bash
# 1. Schema migration
# In prisma/schema.prisma, change:
#   adjustedTime  Float
# To:
#   adjustedTime  Float?
npx prisma migrate dev --name make_adjusted_time_nullable

# 2. Install packages
npm install cheerio jszip
npm install --save-dev @types/cheerio
```

### Scope

- [ ] Modifications log (13 categories, total cost display)
- [ ] Upgrades wishlist with priority + "Move to Mods" action
- [ ] Times tracker (run logging, adjusted time, penalty calculation)
- [ ] Event session view (best run highlight, consistency meter)
- [ ] Calendar view for events (month grid, color-coded chips)
- [ ] URL paste / auto-fill for events (MotorsportReg Cheerio parser)
- [ ] CSV export (per-section, zip bundle for multiple)

### Resolved decisions

- Penalty JSON structure: `Array<{ type: string; count: number; secondsEach: number }>`
- DNF runs: `adjustedTime` is `null` (hence nullable migration above)

---

## Phase 3 — Analytics & Polish ⏳ NOT STARTED

### Pre-work required before starting

- Schema migration: add `MaintenanceAudit` model

### Scope

- [ ] Performance analytics (progress charts, personal records, car comparison)
- [ ] Consistency scoring (std dev of adjusted times)
- [ ] Conditions analysis (best times by weather tags)
- [ ] Season progress widget + Recent runs widget (dashboard)
- [ ] Maintenance snooze + audit trail
- [ ] Additional costs per event (UI — model already exists)
- [ ] Generic URL scraper (Firecrawl fallback)

---

## Phase 4 — Ship It ⏳ NOT STARTED

### Scope

- [ ] Docker Compose packaging for Dokploy VPS deployment
- [ ] `.env.example` + deployment documentation
- [ ] `DISABLE_REGISTRATION` env flag for personal/friends use
- [ ] PWA support (add-to-homescreen, asset caching)
- [ ] Basic self-host README

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

## Open Questions

| #   | Question                                       | Blocking                                      |
| --- | ---------------------------------------------- | --------------------------------------------- |
| 1   | MotorsportReg API availability                 | Phase 5 (Cheerio scraper is Phase 2 fallback) |
| 2   | PWA depth: promote to full offline sync queue? | Phase 5                                       |

---

## Resolved Decisions

| #   | Question                 | Decision                                                                                 | Phase   |
| --- | ------------------------ | ---------------------------------------------------------------------------------------- | ------- |
| 2   | PWA depth                | Basic caching only in Phase 4. Full offline sync queue deferred to Phase 5 as a maybe    | Phase 4 |
| 3   | Tire log                 | First-class entity — tires get their own section in the app, not maintenance log entries | Phase 3 |
| 4   | Billing provider         | Lemon Squeezy (merchant of record, simpler for indie/international)                      | Phase 6 |
| 5   | Paid tier model          | Storage gating only — free users get full app, paid unlocks photo uploads                | Phase 6 |
| 6   | Video on runs            | Out of scope permanently. Photo upload for car profile only (one image)                  | Phase 5 |
| 7   | Co-driver / team support | Cut entirely — not needed for target use case                                            | —       |

---

## Schema Change Log

| Migration             | Phase          | Description                                                                                                                  |
| --------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `20260330174150_init` | Pre-Phase 1    | Initial schema: User, Account, Session, Car, Mod, WishlistItem, MaintenanceEntry, Event, AdditionalCost, Run, PenaltyDefault |
| _(pending)_           | Before Phase 2 | Make `Run.adjustedTime` nullable (`Float?`)                                                                                  |
| _(pending)_           | Before Phase 3 | Add `MaintenanceAudit` model                                                                                                 |
| _(pending)_           | Before Phase 5 | Add `CarPhoto` model                                                                                                         |
| _(pending)_           | Before Phase 6 | Add `Subscription` model, `User.tier` field                                                                                  |
