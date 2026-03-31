# RevLog

Motorsport life organizer — track your events, garage, lap times, mods, and maintenance.

- **Events** — log autocross, track days, HPDE, rally, and more. Auto-fill details from a URL.
- **Garage** — manage your cars, modification history, and upgrades wishlist.
- **Times** — record runs with penalty tracking, session summaries, and personal records.
- **Analytics** — progress charts, consistency scoring, conditions analysis, and car comparison.
- **Maintenance** — interval-based alerts, snooze, and audit trail.

Mobile-first, dark mode, multi-user with full data privacy between accounts.

---

## Quick Start — Docker (Production)

```bash
git clone https://github.com/yourname/revlog.git
cd revlog
cp .env.example .env
# Edit .env — set AUTH_SECRET and POSTGRES_PASSWORD at minimum
docker compose -f docker-compose.prod.yml up -d
```

Open `http://localhost:3000`, register your account, then set `DISABLE_REGISTRATION=true` in `.env` and restart to lock down signups.

To generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

## Quick Start — Development

```bash
# Start Postgres (dev only)
docker compose up -d

# Install dependencies
npm install

# Copy env and set DATABASE_URL for local dev
cp .env.example .env.local
# Edit .env.local: DATABASE_URL=postgresql://revlog:revlog@localhost:5432/revlog

# Run migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

---

## Deploying on Dokploy

1. In Dokploy, create a new **Docker Compose** app pointing at this repository.
2. Set the compose file to `docker-compose.prod.yml`.
3. Add the following environment variables in the Dokploy UI (see table below).
4. Deploy. Migrations run automatically on container startup.

For Google OAuth, set an authorized redirect URI in your Google Cloud Console:
`https://yourdomain.com/api/auth/callback/google`

---

## Environment Variables

| Variable               | Required      | Description                                          |
| ---------------------- | ------------- | ---------------------------------------------------- |
| `AUTH_SECRET`          | Yes           | NextAuth secret. Generate: `openssl rand -base64 32` |
| `DATABASE_URL`         | Yes           | PostgreSQL connection string                         |
| `POSTGRES_PASSWORD`    | Yes (Compose) | Postgres password for docker-compose.prod.yml        |
| `POSTGRES_USER`        | No            | Postgres user (default: `revlog`)                    |
| `POSTGRES_DB`          | No            | Postgres database name (default: `revlog`)           |
| `PORT`                 | No            | App port (default: `3000`)                           |
| `GOOGLE_CLIENT_ID`     | No            | Enables Sign in with Google                          |
| `GOOGLE_CLIENT_SECRET` | No            | Required with `GOOGLE_CLIENT_ID`                     |
| `GOOGLE_MAPS_API_KEY`  | No            | Enables distance calculations for events             |
| `DISABLE_REGISTRATION` | No            | Set to `"true"` to block new signups                 |

---

## Tech Stack

- **Next.js 16** App Router, React 19, TypeScript
- **Prisma 7** + PostgreSQL 16
- **NextAuth v5** — credentials + Google OAuth
- **Tailwind CSS v4** + shadcn/ui
- **Recharts** — analytics charts
- **Serwist** — PWA / add-to-homescreen
