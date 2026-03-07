# Engineering Handoff - PropTech Challenge MVP

This document captures implementation-critical details for future engineers working on this codebase.

## 1) Current Stack and Runtime
- Frontend: Next.js 15 (App Router), React 19, TypeScript.
- Backend/CMS: Payload CMS v3 integrated in the same app.
- DB: SQLite via `@payloadcms/db-sqlite` (`file:./payload.db` by default).
- UI: shadcn/ui + Tailwind.

Key config:
- Payload config: `payload.config.ts`
- Next scripts: `package.json`

## 2) Core Domain Model
Collections registered in Payload:
- `users` (auth-enabled): roles = `tenant | manager | technician`
- `tickets`: maintenance workflow entity
- `activity-logs`: immutable server-side event history per ticket
- `notifications`: in-app notifications per user
- `media`: uploaded images

Role ownership model:
- Tenant creates and views own tickets.
- Manager views/updates all tickets, assigns technicians, changes priority/status.
- Technician views/updates only assigned tickets, with strict field restrictions.

## 3) Ticket Workflow Rules (Source of Truth)
Primary file: `src/collections/Tickets.ts`

Allowed status transitions:
- `open -> assigned -> in-progress -> done`

Enforced invariants in `beforeChange`:
- Technician can only edit tickets assigned to them.
- Technician cannot edit manager-only fields (`assignedTo`, `priority`, `title`, etc.).
- If assignment changes from none -> technician while status is `open`, status is auto-set to `assigned`.
- `assigned` status requires `assignedTo`.
- `in-progress` and `done` require `assignedTo`.
- Clearing `assignedTo` is blocked unless resulting status is `open`.
- `done` sets `resolvedAt` automatically.

## 4) Business Logic Hooks
Primary file: `src/hooks/tickets/afterChangeTicket.ts`

`tickets.afterChange` behavior:
- On create:
  - create activity-log (`created`)
  - notify all managers (paginated manager lookup)
- On update:
  - if assignee changed: create activity-log (`assigned`) + notify assignee
  - if status changed: create activity-log (`status-changed`)
    - if now `assigned`: notify assignee
    - if now `done`: notify tenant
  - if priority changed: create activity-log (`priority-changed`)

Helper:
- `src/hooks/tickets/createActivityLog.ts` centralizes activity-log writes.

## 5) Seeding and Demo Data
Primary file: `src/seed.ts`

What seed creates:
- 1 manager
- 2 technicians
- 2 tenants
- 5 tickets spanning `open`, `assigned`, `in-progress`, `done`

Safety controls:
- Refuses to run when `NODE_ENV=production`.
- Requires `SEED_PASSWORD` (minimum 12 chars).

Idempotency behavior:
- Users are upserted by `email` (existing records updated).
- Tickets are upserted by (`title`, `tenant`, `unit`) and updated on reruns.

Run seed:
```bash
# PowerShell
$env:SEED_PASSWORD="ChangeMe-Seed-2026"
npm run seed
```

## 6) Important Environment Variables
- `PAYLOAD_SECRET` (recommended to set explicitly)
- `DATABASE_URL` (optional, defaults to SQLite file)
- `SEED_PASSWORD` (required for seed script)

## 7) Operational Commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Prod build: `npm run build`
- Seed demo data: `npm run seed` (with `SEED_PASSWORD`)

## 8) Known Runtime Notes
- Payload warns if no email adapter is configured; notifications are in-app only for now.
- Payload warns if `sharp` is not installed while image resizing is configured.
- `payload.db` is generated locally and ignored by git.

## 9) Where To Extend Next
Recommended extension points:
- Auth/session helpers and route middleware (frontend app routes).
- Role-based dashboard and ticket list/detail views.
- Notification bell/inbox polling UX.
- Add integration tests for status invariants and hook side effects.

## 10) Files Worth Reading First
- `payload.config.ts`
- `src/lib/access.ts`
- `src/collections/Tickets.ts`
- `src/collections/Users.ts`
- `src/collections/ActivityLogs.ts`
- `src/collections/Notifications.ts`
- `src/hooks/tickets/afterChangeTicket.ts`
- `src/hooks/tickets/createActivityLog.ts`
- `src/seed.ts`
