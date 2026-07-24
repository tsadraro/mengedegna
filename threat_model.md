# Threat Model

## Project Overview

A Node.js/Express 5 API server ("Mengedegna") with a React frontend, backed by PostgreSQL via Drizzle ORM. The API acts as a generic backend-as-a-service: it hosts multiple "apps" identified by `appId`, manages per-app user accounts (with email/OTP/password auth and JWT sessions), and stores arbitrary JSON entities. The project is not currently deployed. Stack: pnpm workspaces, TypeScript 5.9, Express 5, Drizzle ORM, Zod, bcryptjs, jsonwebtoken.

## Assets

- **User credentials** — email addresses, bcrypt-hashed passwords, OTP codes, password-reset tokens, JWT session tokens. Compromise allows account takeover.
- **JWT signing secret** — used to sign and verify all session tokens. If the secret is weak or falls back to the hardcoded default, all tokens can be forged.
- **Entity data** — arbitrary JSON objects stored per app. May contain PII, business data, or sensitive application state.
- **Application secrets** — `DATABASE_URL`, `SESSION_SECRET`. Exposure gives full DB or auth bypass capability.

## Trust Boundaries

- **Public internet → API server** — All HTTP requests from clients. The API must authenticate and authorize every request before returning data or mutating state.
- **API server → PostgreSQL** — Direct DB access via Drizzle ORM. SQL injection at the API layer gives full database access.
- **Authenticated → Unauthenticated** — Auth endpoints are public; entity CRUD and user management should require valid JWT, but currently lack enforcement.
- **User → Admin** — Role separation exists in the data model but privilege escalation is possible via self-update.

## Scan Anchors

- **Primary entry point**: `artifacts/api-server/src/routes/apps.ts` — all business logic in one file
- **Auth logic**: `artifacts/api-server/src/lib/auth.ts`
- **High-risk areas**: `buildJsonbFilter()`, `buildOrderBy()`, entity CRUD handlers (lines 436–596), User/me PUT (line 398)
- **Public surfaces**: all `/api/apps/:appId/auth/*` routes + all entity CRUD routes (unauthenticated)
- **Mockup sandbox** (`artifacts/mockup-sandbox/`) — dev-only, not production-reachable

## Threat Categories

### Spoofing / Authentication Bypass

JWT tokens are signed with `SESSION_SECRET` env var, falling back to a hardcoded string `"mengedegna-dev-secret-fallback"` if unset. An attacker who knows the fallback can forge valid tokens for any userId/role. OTP and password-reset tokens are generated with `Math.random()` (non-CSPRNG), making them statistically predictable. Additionally, both are returned directly in API responses rather than being sent via email, completely bypassing the verification intent.

Guarantee required: `SESSION_SECRET` MUST be set and random; OTP/reset tokens MUST use `crypto.randomBytes()`; tokens MUST NOT be returned in API responses.

### Tampering / SQL Injection

`buildJsonbFilter()` and `buildOrderBy()` build raw SQL strings from user-controlled query parameters (`q` and `sort`) without parameterization. The `$ne` and `$in` operators in `buildJsonbFilter`, and the field name in `buildOrderBy`, are embedded directly into SQL strings. The full raw SQL query is then executed via `db.execute(sql.raw(...))`. This allows an attacker to inject arbitrary SQL.

Guarantee required: All dynamic query construction MUST use parameterized queries or safe Drizzle ORM builders; no raw SQL interpolation from user input.

### Broken Access Control

Entity CRUD endpoints (list, get, create, update, delete, bulk create) have no authentication requirement. Any anonymous user can read, create, update, or delete entities across all apps. The User/me PUT endpoint accepts a `role` field from the request body and applies it without restriction, allowing any authenticated user to elevate their own role to admin.

Guarantee required: All entity endpoints MUST require valid JWT; role updates from users MUST be rejected server-side.

### Information Disclosure

CORS is configured with wildcard (`cors()` with no options), allowing any origin to make credentialed cross-site requests. OTP codes and password-reset tokens are returned verbatim in API response bodies, making email verification and password-reset flows trivially bypassable.

### Denial of Service

No rate limiting on authentication endpoints. `Math.random()`-based 6-digit OTPs (1 in 900,000 range) could be brute-forced against the verify-otp endpoint with no lockout.
