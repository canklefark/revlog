# Product Requirements Document

## RevLog — Motorsport Life Organizer

**Version:** 1.1
**Date:** March 30, 2026
**Status:** Active

---

## 1. Executive Summary

RevLog is a mobile-first web application designed to help motorsport enthusiasts
organize every aspect of their racing life in one place. It covers event discovery
and registration tracking, garage and car management, maintenance logging with
alerts, performance tracking with analytics, and one-way calendar synchronization.
It is designed as a multi-user platform, self-hosted by default, with an open
source release path and optional monetization in the future.

---

## 2. Problem Statement

Amateur and semi-professional motorsport participants currently manage their racing
lives across a fragmented set of tools: spreadsheets for budgets, calendar apps for
events, notes apps for maintenance, and memory for lap times. There is no unified,
purpose-built tool that understands the nuances of motorsport — multiple disciplines,
multiple cars, garage-to-event logistics, and run-by-run performance data. RevLog
solves this.

---

## 3. Target Users

| Persona                     | Description                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| The Weekend Warrior         | Autocross/RallyCross competitor, 1–2 cars, plans their season around a regional calendar   |
| The Enthusiast Climber      | Moving from HPDE toward competitive track events like GridLife, needs to track progression |
| The Multi-Discipline Driver | Runs autox, track days, and drag events — needs flexible event types                       |
| The Wrench-Turner           | Does their own maintenance, wants a detailed garage log to reference and export            |
| Open Source Self-Hoster     | Technically capable user who wants full data ownership and privacy                         |

---

## 4. Tech Stack

| Layer                | Technology                                   | Rationale                                                     |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| Frontend             | Next.js 15 (App Router) + React 19           | Best LLM codegen support, massive ecosystem                   |
| Styling              | Tailwind CSS + shadcn/ui (Radix)             | Rapid, consistent UI with accessible components               |
| Auth                 | NextAuth.js v5 (Auth.js)                     | Multi-user, OAuth (Google for calendar), open-source friendly |
| Database             | PostgreSQL — Docker in dev, VPS in prod      | Relational data fits this domain perfectly                    |
| ORM                  | Prisma 7 (direct PrismaClient, no adapter)   | Type-safe, great codegen                                      |
| File/Asset Storage   | Cloudflare R2 / S3-compatible (Phase 5)      | User-familiar, cheap, self-hostable                           |
| Calendar Sync        | Google Calendar API (OAuth)                  | One-way push, full event details                              |
| Geo/Distance         | Google Maps Distance Matrix API or Mapbox    | Drive time + distance from home                               |
| URL Scraping         | Cheerio + custom parsers, Firecrawl fallback | Paste a URL, extract event details                            |
| Deployment (Default) | VPS via Dokploy                              | Self-hosted, full control, Docker-based                       |
| Deployment (Alt)     | Vercel or Cloudflare Pages                   | Optional for users who prefer managed hosting                 |

> **Note on Supabase:** Supabase is not the default and no Supabase client
> libraries are used. Users who want managed Postgres may point their
> `DATABASE_URL` at Supabase — it is just Postgres under the hood.

> **Note on Svelte:** Architecture is framework-agnostic. SvelteKit could
> replace Next.js without changing data models, API routes, or integrations.

---

## 5. System Architecture Overview

 ┌─────────────────────────────────────────┐
│ Next.js App │
│ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│ │ Dashboard│ │ Events │ │Garage │ │
│ └──────────┘ └──────────┘ └───────┘ │
│ ┌──────────┐ ┌──────────┐ │
│ │ Times │ │Settings │ │
│ └──────────┘ └──────────┘ │
│ Server Actions / API Routes│
└────────┬────────────────────────────────┘
│
┌─────▼──────┐ ┌───────────────┐
│ PostgreSQL │ │ R2 / S3 │
│ (Prisma) │ │ (Phase 5) │
└────────────┘ └───────────────┘
│
┌─────▼──────────────────────────────┐
│ External APIs │
│ Google Calendar │ Maps │ MSReg │
│ Firecrawl/Scraper │
└────────────────────────────────────┘

 

### 5.1 Deployment Models

| Model                     | Database                  | File Storage                  | Target User                    |
| ------------------------- | ------------------------- | ----------------------------- | ------------------------------ |
| **Self-Hosted / Default** | Postgres on VPS (Dokploy) | S3-compatible (user provides) | Default — full data ownership  |
| **Local Dev**             | Postgres in Docker        | None                          | Development                    |
| **Supabase (Optional)**   | Supabase Postgres         | Supabase Storage              | Users who prefer managed infra |
| **Paid Hosted (Phase 6)** | Managed Postgres          | Cloudflare R2                 | Future                         |

Self-hosted deployments ship as a single `docker-compose.yml` with Postgres and
the Next.js app. A `.env.example` documents all required configuration.

---

## 6. Feature Specifications

### 6.1 Authentication & User Management

**Requirements:**

- Email/password registration and login
- OAuth login via Google (required for Google Calendar integration)
- User profile: name, profile photo, home garage address (geocoded), preferred
  calendar, timezone, preferred units (miles/km), season budget
- Account deletion with full data export before deletion
- Session management with secure JWT tokens
- `DISABLE_REGISTRATION` env flag to lock signups (for personal/friends use)

**Multi-user privacy model:**

- All data is scoped to the authenticated user — no data is ever shared or
  visible across accounts

---

### 6.2 Dashboard

| Widget             | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| Next Event Card    | Next upcoming event — name, date, distance, drive time, status, fee |
| Events Timeline    | Scrollable chronological upcoming events with status badges         |
| Budget Snapshot    | Season spend vs. budget, color-coded progress bar                   |
| Maintenance Alerts | Cars with overdue or soon-due maintenance, color-coded by urgency   |
| Recent Runs        | Last 3–5 runs with event name, car, best time                       |
| Season Progress    | Events completed vs. planned for the year                           |

**Design Notes:**

- Mobile-first card layout — stacks vertically on mobile, grid on desktop
- Dark mode default, light mode toggle
- Bottom nav on mobile: Dashboard, Events, Garage, Times, Settings

---

### 6.3 Event Management

#### 6.3.1 Adding Events

**A) Manual Entry**

| Field                 | Type              | Required | Notes                                                                                                                         |
| --------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Event Name            | Text              | Yes      |                                                                                                                               |
| Event Type            | Select            | Yes      | Autocross, RallyCross, HPDE, Track Day, Time Attack, Drag, Test & Tune, Practice Session, Hill Climb, Endurance, Drift, Other |
| Organizing Body       | Text              | No       | e.g., SCCA, NASA, GridLife                                                                                                    |
| Date(s)               | Date / Date Range | Yes      | Support multi-day events                                                                                                      |
| Venue / Track Name    | Text              | No       |                                                                                                                               |
| Address               | Text + Geocode    | No       | Auto-geocoded for distance calc                                                                                               |
| Registration Status   | Select            | Yes      | Interested, Registered, Waitlisted, Completed, Skipped                                                                        |
| Registration Deadline | Date              | No       | Triggers reminder                                                                                                             |
| Entry Fee             | Currency          | No       |                                                                                                                               |
| Additional Costs      | Currency + Note   | No       | Fuel, lodging, tires — multiple line items                                                                                    |
| Registration URL      | URL               | No       |                                                                                                                               |
| Car                   | Select            | No       | From user's garage                                                                                                            |
| Run Group / Class     | Text              | No       | e.g., "Street Mod", "Novice"                                                                                                  |
| Notes                 | Rich text         | No       |                                                                                                                               |

**B) URL Paste / Auto-Fill**

- User pastes a URL → server scrapes and parses event details
- Results pre-fill the manual form — user always gets final edit authority
- Priority target: MotorsportReg (dedicated parser)
- Generic fallback: Cheerio scraper, then Firecrawl for JS-rendered pages
- If scraping fails: save URL to Registration URL field, user fills rest manually

**C) MotorsportReg Integration**

- Dedicated HTML scraper for MSReg event pages (Phase 2)
- Direct API integration if MSReg API becomes available (Phase 6)

#### 6.3.2 Event Detail View

- All event metadata
- Distance & drive time from home ("147 mi · 2h 23m") — calculated once, cached
- Map embed with open-in-maps link
- Registration status one-click update
- Linked car with quick link to car profile
- Budget line: entry fee + additional costs
- Runs logged at this event (from Times Tracker)
- Calendar sync status (synced ✓ / not synced / error ⚠)

#### 6.3.3 Event List & Calendar Views

**List View (default):** chronological, filterable by type/status/car/date,
sortable by date/cost/distance

**Calendar View:** month grid, color-coded chips by event type, tap day for events

**Season Selector:** default current year, toggle years, "all upcoming" option

#### 6.3.4 Calendar Sync

- Auto-push to Google Calendar when status → Registered
- Remove from calendar when status → Skipped or event deleted
- Update calendar event when event details change
- Calendar event includes: title, dates, full address, org body, fee, run group,
  registration URL, notes
- Settings: connect via OAuth, select target calendar, global toggle
- Future: Apple CalDAV, Outlook Graph API (abstraction layer planned)

---

### 6.4 Garage (Car Management)

#### 6.4.1 Car Profile

| Field            | Type                | Required                                     |
| ---------------- | ------------------- | -------------------------------------------- |
| Nickname         | Text                | No                                           |
| Year             | Number              | Yes                                          |
| Make             | Text                | Yes                                          |
| Model            | Text                | Yes                                          |
| Trim             | Text                | No                                           |
| Color            | Text + Color picker | No                                           |
| VIN              | Text                | No                                           |
| Purchase Date    | Date                | No                                           |
| Purchase Price   | Currency            | No                                           |
| Current Odometer | Number              | No                                           |
| Photo(s)         | Image upload → R2   | No (Phase 5)                                 |
| Primary Use      | Select              | No (Daily, Track Only, Dual Purpose, Stored) |
| Notes            | Rich text           | No                                           |

#### 6.4.2 Modifications Log

| Field                | Type          | Required         |
| -------------------- | ------------- | ---------------- |
| Mod Name             | Text          | Yes              |
| Category             | Select        | Yes              |
| Brand / Manufacturer | Text          | No               |
| Part Number          | Text          | No               |
| Install Date         | Date          | No               |
| Installed By         | Select + Text | No (Self / Shop) |
| Cost                 | Currency      | No               |
| Odometer at Install  | Number        | No               |
| Notes                | Rich text     | No               |

**Categories:** Engine, Suspension, Brakes, Wheels & Tires, Aero, Interior,
Safety, Electrical, Exhaust, Drivetrain, Cooling, Forced Induction, Other

**Display:** grouped by category, collapsible, sortable, total mod cost at top

#### 6.4.3 Upgrades Wishlist

| Field             | Type         | Required                          |
| ----------------- | ------------ | --------------------------------- |
| Item Name         | Text         | Yes                               |
| Category          | Same as mods | No                                |
| Estimated Cost    | Currency     | No                                |
| Priority          | Select       | No (Low, Medium, High, Must Have) |
| Link / Source URL | URL          | No                                |
| Notes             | Text         | No                                |

**Display:** sorted by priority (Must Have → Low), running total at top,
one-click "Move to Mods" action

#### 6.4.4 Maintenance Log

| Field                 | Type          | Required                          |
| --------------------- | ------------- | --------------------------------- |
| Service Type          | Select        | Yes                               |
| Custom Service Name   | Text          | If "Custom" selected              |
| Date Performed        | Date          | Yes                               |
| Odometer              | Number        | No                                |
| Performed By          | Select + Text | No (Self / Shop)                  |
| Product / Brand Used  | Text          | No                                |
| Product Spec / Weight | Text          | No (e.g., "5W-30 Full Synthetic") |
| Cost                  | Currency      | No                                |
| Notes                 | Rich text     | No                                |
| Next Due Date         | Date          | No                                |
| Next Due Mileage      | Number        | No                                |

**Service Types:** Oil Change, Tire Rotation, Tire Change, Brake Fluid Flush,
Coolant Flush, Valve Adjustment, Alignment, Brake Pads, Brake Rotors, Spark Plugs,
Air Filter, Transmission Fluid, Differential Fluid, Belt/Chain Service, Wheel
Bearing, Clutch, Power Steering Fluid, Wiper Blades, Battery, Inspection, Custom

**Maintenance Alerts:**

| Condition                         | Level    | Color  |
| --------------------------------- | -------- | ------ |
| Within 30 days OR within 500 mi   | Upcoming | Yellow |
| Within 7 days OR within 100 mi    | Due      | Orange |
| Past due date OR past due mileage | Overdue  | Red    |

Alerts shown on car profile, Dashboard widget, and Garage nav badge.
Actions: "Mark Complete" (opens pre-filled entry form) or "Snooze 30 days"

#### 6.4.5 Data Export

Checkboxes per section:

- Car Profile, Modifications Log, Upgrades Wishlist, Maintenance Log,
  Event History, Run History

Single section → `.csv`. Multiple sections → one `.csv` each, bundled as `.zip`.

---

### 6.5 Times Tracker

#### 6.5.1 Run Logging

Each run is tied to an event (including Practice Session / Test & Tune events).

| Field                 | Type                 | Required                                  |
| --------------------- | -------------------- | ----------------------------------------- |
| Event                 | Select               | Yes                                       |
| Car                   | Select               | Yes (auto-filled from event)              |
| Run Number            | Number               | Auto-incremented                          |
| Time                  | Duration (mm:ss.ms)  | Yes                                       |
| Penalties             | Multi-select + count | No (Cone, Off-Course, DNF, DNS, Red Flag) |
| Adjusted Time         | Duration             | Auto-calculated (nullable for DNF)        |
| Conditions            | Tags                 | No (Dry, Wet, Cold, Hot, Dusty, Night)    |
| Tire Compound / Setup | Text                 | No                                        |
| Notes                 | Rich text            | No                                        |

**Penalty JSON structure:** `Array<{ type: string; count: number; secondsEach: number }>`

**Adjusted time** = raw time + (cones × penalty seconds). DNF = null adjusted time.
Default: 2s/cone for Autocross. Configurable per event type in Settings.

#### 6.5.2 Event Session View

- All runs listed chronologically: run #, raw time, penalties, adjusted time
- Best run highlighted
- Consistency meter (spread between best and worst)
- Quick-add run button

#### 6.5.3 Performance Analytics

**Per-event:** best raw/adjusted time, run-over-run chart, penalty breakdown

**Cross-event / season:**

- Progress chart: best time per event over time
- Personal records by venue, event type, and car
- Car comparison at same venue
- Consistency score (std dev of adjusted times)
- Conditions analysis (best times by weather tag)

All charts via Recharts, responsive and touch-friendly.

---

### 6.6 Settings

| Setting          | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| Profile          | Name, email, profile photo, home garage address                    |
| Units            | Miles/km, °F/°C, currency                                          |
| Calendar Sync    | Connect/disconnect Google Calendar, select calendar, toggle on/off |
| Season Budget    | Annual event spending target                                       |
| Penalty Defaults | Default penalty rules per event type                               |
| Data Management  | Export all data, delete account                                    |
| Appearance       | Dark / light / system                                              |

---

## 7. Data Models (Prisma Schema Overview)

 User
├── id, email, name, profilePhoto, homeAddress, homeLatLng,
│ timezone, units, seasonBudget, calendarProvider,
│ calendarId, calendarSyncEnabled
│
├── Cars[]
│ ├── id, nickname, year, make, model, trim, color, vin,
│ │ purchaseDate, purchasePrice, currentOdometer,
│ │ primaryUse, notes
│ ├── Mods[]
│ ├── WishlistItems[]
│ └── MaintenanceEntries[]
│ └── ...nextDueDate, nextDueMileage, snoozedUntil
│
├── Events[]
│ ├── id, name, type, organizingBody, startDate, endDate,
│ │ venueName, address, lat, lng, distanceFromHome,
│ │ driveTimeMinutes, registrationStatus,
│ │ registrationDeadline, entryFee, registrationUrl,
│ │ carId, runGroup, notes, calendarEventId
│ ├── AdditionalCosts[]
│ └── Runs[]
│ └── id, carId, runNumber, rawTime, penalties (JSON),
│ adjustedTime (nullable), conditions[], tireSetup, notes
│
└── PenaltyDefaults[]

##  

## 8. API & Integration Details

### 8.1 MotorsportReg

- Phase 2: dedicated Cheerio scraper for MSReg event pages
- Phase 6: direct API integration if MSReg API is available
- Data extracted: name, date(s), venue, address, fee, deadline, org body

### 8.2 URL Scraping (Generic)

- Cheerio server-side scraper with platform-specific parsing rules
- Firecrawl API fallback for JS-rendered pages
- On failure: save URL only, user fills rest manually

### 8.3 Google Calendar API

- OAuth 2.0 via NextAuth Google provider (`calendar.events` scope)
- Operations: create, update, delete
- Triggers: status → Registered (create), edit (update), Skipped/deleted (delete)
- Env-gated: no-op if credentials not configured
- On failure: mark sync error, allow manual retry

### 8.4 Distance / Drive Time

- Google Maps Distance Matrix API (or Mapbox)
- Calculated once when address is set, cached on the event record
- Env-gated: no-op if credentials not configured

---

## 9. UI/UX Principles

1. **Mobile-first always.** Phone first, desktop is a wider reflow — never separate
2. **Dark mode default.** Light mode available via toggle
3. **Data density over decoration.** Dashboard = cockpit feel, zero fluff
4. **One-tap actions.** Status changes, run logging, maintenance completion = 1–2 taps
5. **Progressive disclosure.** Required fields first, optional in collapsible sections
6. **Offline tolerance.** Show cached data gracefully on spotty track connectivity

---

## 10. Phased Roadmap

### Phase 1 — MVP (Core Loop) ✅ COMPLETE

Auth, user profile, dashboard, event CRUD, distance calc, car CRUD,
maintenance log + alerts, Google Calendar sync, responsive layout, dark mode

### Phase 2 — Garage & Tracking

- Modifications log (structured, 13 categories)
- Upgrades wishlist with priority + Move to Mods
- Times tracker (run logging, penalty calc, adjusted time)
- Event session view (best run, consistency meter)
- Calendar view for events (month grid, color-coded)
- URL paste / auto-fill (MotorsportReg Cheerio parser)
- CSV export (per-section, zip bundle)

### Phase 3 — Analytics & Polish

- Performance analytics (progress charts, personal records, car comparison)
- Consistency scoring (std dev)
- Conditions analysis
- Season progress + Recent runs dashboard widgets
- Maintenance snooze + audit trail
- Additional costs per event (UI — model exists)
- Generic URL scraper (Firecrawl fallback)
- Tire log (first-class entity — compound, size, purchase date, heat cycles, retirement)

### Phase 4 — Ship It

- Docker Compose packaging for Dokploy VPS deployment
- `.env.example` + deployment documentation
- `DISABLE_REGISTRATION` env flag for personal/friends use
- PWA support (add-to-homescreen, asset caching)
- Basic self-host README

### Phase 5 — Open Source Prep

- Multi-stage Dockerfile, clean Docker Compose for public use
- MinIO option for self-hosted file storage
- Photo uploads (R2 / S3-compatible abstraction)
- Additional calendar providers (Apple CalDAV, Outlook Graph API)
- Comprehensive self-host documentation
- MotorsportReg API integration (API Docs in @DOCS/motorsportreg-api.md)
- Photo uploads — car profile photo only (R2 / S3-compatible abstraction)

### Phase 6 — Monetization (Future / No timeline)

- Billing provider: Lemon Squeezy
- Paid tier feature matrix (what is free vs paid)
- Paid tier: storage gating only (photo uploads)
- Subscription model implementation
- Hosted tier infrastructure
- `Subscription` model + `User.tier` schema additions

---

## 11. Security & Privacy Considerations

- All data scoped per-user at query level — every query includes `userId` filter
- Passwords hashed with bcrypt (minimum 12 rounds)
- All routes require authentication before any data operation
- OAuth tokens stored encrypted at rest
- Google Calendar refresh tokens never exposed to client
- Home address and coordinates never exposed in public API
- Rate limiting on auth endpoints
- CSRF protection on all mutating endpoints
- No telemetry, no analytics, no phone-home — self-hosted users own all data

---

## Open Questions

| #   | Question                                       | Blocking                                      |
| --- | ---------------------------------------------- | --------------------------------------------- |
| 1   | MotorsportReg API availability                 | Phase 5 (Cheerio scraper is Phase 2 fallback) |
| 2   | PWA depth: promote to full offline sync queue? | Phase 5                                       |
