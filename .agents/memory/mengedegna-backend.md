---
name: Mengedegna backend architecture
description: How the custom Express backend replaces Base44 BaaS for the Mengedegna bus-booking app.
---

## Architecture

- **Frontend**: React 18 + Vite at `artifacts/mengedegna`, uses `@base44/sdk` with `serverUrl: ''` (relative URL).
- **Backend**: Express at `artifacts/api-server`, serves Base44-compatible API on `/api/apps/:appId/...`.
- **Database**: PostgreSQL via Drizzle ORM. Two tables:
  - `entities` — JSONB key-value store for all app entities (Route, Booking, RouteAlert, OperatorReview, InAppNotification).
  - `auth_users` — users with bcrypt passwords + JWT auth (SESSION_SECRET used as JWT secret).

## Key URL patterns (Base44 SDK → our server)

- `GET /api/apps/:appId/entities/:entity` — list/filter (q param = JSON-stringified MongoDB-style query)
- `GET /api/apps/:appId/entities/:entity/:id` — get by ID
- `POST /api/apps/:appId/entities/:entity` — create
- `PUT /api/apps/:appId/entities/:entity/:id` — update (merges patch into existing data)
- `POST /api/apps/:appId/entities/:entity/bulk` — bulk create
- `GET /api/apps/:appId/entities/User/me` — current user (JWT required)
- `POST /api/apps/:appId/auth/login` — email/password → `{access_token, user}`
- `POST /api/apps/:appId/auth/register` — create account
- `GET /api/apps/public/prod/public-settings/by-id/:appId` — app config (no auth)
- `POST /api/apps/:appId/analytics/track/batch` — no-op 200

## App ID

`VITE_BASE44_APP_ID = "mengedegna"` (set in shared env vars). Routes seeded under this appId.

## Auth

JWT signed with `SESSION_SECRET`. Token stored in browser localStorage by the SDK. 401 on User/me when not logged in is **expected and correct** — the app sets `isAuthenticated=false` and continues as guest.

**Why:** Base44's localStorage caches the appId; the env var `VITE_BASE44_APP_ID` overrides it on each page load (because `getAppParamValue` saves defaultValue to storage when truthy).

## Seed data

19 routes seeded on server startup if `entities` table is empty (appId = "mengedegna"). Routes span all major Ethiopian cities: Addis Ababa ↔ Bahir Dar/Gondar/Mekelle/Hawassa/Dire Dawa/Harar/Jimma/Adama/Arbaminch/Dessie. Operators: Selam Bus, ODAA Integrated, Zemen Bus, Yegna Bus, Velocity Express, Golden Bus.
