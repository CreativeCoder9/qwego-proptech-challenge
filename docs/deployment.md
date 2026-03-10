# Production Deployment Guide

This document describes how to deploy this project to production safely.

## 1) Deployment Model

This app is a single Next.js server process that includes:

- user-facing app routes
- Payload REST API (`/api/*`)
- Payload Admin UI (`/admin`)
- local media storage (`/media`)

The default database is SQLite (`payload.db`), stored on disk.

Important:

- Current config uses Payload's SQLite adapter.
- If `DATABASE_URL` is not set, the app falls back to `file:./payload.db`.
- Turso (libSQL) can be used as a production SQLite drop-in with this adapter by using a `libsql://...` database URL.
- A Postgres URL will not switch adapters automatically; Postgres requires explicit adapter/config changes.
- For Turso deployments, set `LIBSQL_AUTH_TOKEN` in runtime config so the libSQL client can authenticate.

## 2) Prerequisites

- Node.js 20+ (same major used in development)
- npm
- Linux/Windows server with persistent disk
- A process manager (PM2, systemd, Docker, etc.)
- TLS termination (Nginx, Caddy, cloud load balancer)

## 3) Required Environment Variables

Set these in production:

- `PAYLOAD_SECRET` (required, strong random secret)
- `DATABASE_URL` (recommended explicit path, e.g. `file:/var/lib/property-manager/payload.db`)
  - local SQLite example: `file:/var/lib/property-manager/payload.db`
  - Turso/libSQL example: `libsql://your-db-name-your-org.turso.io`
- `LIBSQL_AUTH_TOKEN` (required when your Turso/libSQL endpoint enforces auth)
- `APP_BASE_URL` (public base URL, e.g. `https://app.example.com`)
- SMTP variables if you need email notifications:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM_ADDRESS`
  - `SMTP_FROM_NAME`

Optional business profile variables (admin UI cards):

- `BUSINESS_NAME`
- `BUSINESS_TAGLINE`
- `BUSINESS_ADDRESS`
- `BUSINESS_EMAIL`
- `BUSINESS_PHONE`
- `BUSINESS_HOURS`
- `MANAGEMENT_PORTAL_URL`

## 4) Build and Start

```bash
npm ci
npm run build
npm run start
```

Default start command runs Next.js production server on port `3000`.

If needed:

```bash
PORT=3000 npm run start
```

## 5) First Production Bootstrap

- Open `/admin`.
- If this is a fresh database, the first created user is automatically assigned `admin`.
- Only `admin` users can access Payload admin portal.

After first bootstrap, verify:

- admin can access `/admin`
- manager can access `/users` and manage tenant/technician accounts
- non-admin cannot access `/admin`

## 6) Persistent Data

Persist these paths across deployments:

- SQLite DB file (default `payload.db`)
- media upload directory (`media/`)

Do not deploy with ephemeral storage unless you use an external DB/storage strategy.

## 7) Reverse Proxy and TLS

Put the app behind a reverse proxy with HTTPS:

- terminate TLS at proxy/load balancer
- forward traffic to app (`localhost:3000`)
- keep `X-Forwarded-*` headers intact

Recommended:

- enforce HTTPS redirect
- set request size limits appropriate for image uploads

## 8) Process Management

Use one of:

- `systemd` service
- PM2
- container orchestrator

Minimum requirements:

- automatic restart on crash
- startup on reboot
- centralized logs

## 9) Backups and Recovery

For SQLite deployments, back up:

- DB file
- media directory

Recommended:

- daily backups + retention policy
- periodic restore test in staging

## 10) Production Validation Checklist

After each deploy:

1. `GET /` returns landing page for unauthenticated users.
2. Authenticated user visiting `/` redirects to `/dashboard`.
3. `/admin` works for admin and is blocked for non-admin.
4. Ticket create/update flows work.
5. Notification creation and read flow work.
6. Media uploads render correctly from `/media/*`.

## 11) Security Notes

- Never use fallback `PAYLOAD_SECRET` in production.
- Restrict server/network access to only required ports.
- Keep dependencies updated and rerun:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`

## 12) Useful Commands

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

Optional seed in non-production environments only:

```bash
SEED_PASSWORD='ChangeMe-Seed-2026' npm run seed
```
