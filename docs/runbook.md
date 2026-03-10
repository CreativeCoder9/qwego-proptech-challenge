# Runbook

## Prerequisites

- Node.js 20+ (project currently built/tested on modern Node runtime)
- npm

## Install

```bash
npm install
```

## Environment Variables

Copy from `.env.example` and set values:

```bash
PAYLOAD_SECRET=replace-with-a-strong-secret
DATABASE_URL=file:./payload.db
SEED_PASSWORD=ChangeMe-Seed-2026
```

Notes:

- `PAYLOAD_SECRET` has a code fallback (`dev-secret-change-me`) but should always be set explicitly.
- `DATABASE_URL` defaults to local SQLite in project root if omitted.
- `SEED_PASSWORD` is required only for `npm run seed` and must be at least 12 characters.

## Run in Development

```bash
npm run dev
```

## Build and Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Seed Demo Data

PowerShell example:

```powershell
$env:SEED_PASSWORD="ChangeMe-Seed-2026"; npm run seed
```

What seed currently creates:

- 1 admin
- 2 technicians
- 2 tenants
- 5 tickets across `open`, `assigned`, `in-progress`, and `done`

## Payload Admin

- Payload is embedded in the Next app.
- Open `/admin` while running the app to access admin UI.
- Only users with role `admin` can access the Payload CMS admin portal.
- The first user created in an empty database is automatically assigned role `admin`.

## People Management (Management Portal)

- Managers and admins can manage tenant and technician accounts in the app portal at `/users`.
- Managers are scoped to tenant/technician accounts only.

## Upload Storage

- Media uploads are configured to write under `media`.
- Generated image sizes: `thumbnail`, `medium`.
- Access is still governed by Payload collection access (`src/collections/Media.ts`).

## Useful Paths

- `payload.config.ts`
- `src/collections/*`
- `src/hooks/tickets/*`
- `src/lib/access.ts`
- `docs/BUSINESS-LOGIC.md`
