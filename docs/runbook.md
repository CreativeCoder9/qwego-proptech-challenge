# Runbook

## Prerequisites

- Node.js 20+ (project currently built/tested on modern Node runtime)
- npm

## Install

```bash
npm install
```

## Environment Variables

Create `.env.local` (or `.env`) with at least:

```bash
PAYLOAD_SECRET=replace-with-a-strong-secret
DATABASE_URL=file:./payload.db
```

Notes:

- `PAYLOAD_SECRET` has a fallback in code (`dev-secret-change-me`) but should be set explicitly.
- `DATABASE_URL` defaults to local SQLite in project root if omitted.

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

## Payload Admin

- Payload is embedded in the Next app.
- Open `/admin` while running the app to access admin UI.
- On first run, create the initial user through admin if prompted.

## Upload Storage

- Media uploads are configured to write under `public/media`.
- Generated image sizes: `thumbnail`, `medium`.

## Useful Paths

- Task artifacts/spec/plan:
  - `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/spec.md`
  - `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md`
- Payload config:
  - `payload.config.ts`
- Collections:
  - `src/collections/*`
