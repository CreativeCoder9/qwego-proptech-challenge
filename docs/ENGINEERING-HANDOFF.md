# Engineering Handoff - PropTech MVP

This file is a practical handoff for the next engineer continuing implementation.

## Project Snapshot
- Stack: Next.js 15 App Router + Payload CMS v3 + SQLite + shadcn/ui.
- Status: Plan steps complete through `Auth Flow & Middleware`; dashboard/ticket UI flows are still pending.
- Source of truth for scope and sequence:
  - `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/spec.md`
  - `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md`

## What Is Implemented

### Data model and access control
- Collections in `payload.config.ts`:
  - `users`, `media`, `tickets`, `activity-logs`, `notifications`
- Role model:
  - `tenant | manager | technician`
- Key access logic:
  - `src/collections/Users.ts`
  - `src/collections/Tickets.ts`
  - `src/collections/ActivityLogs.ts`
  - `src/collections/Notifications.ts`

### Ticket workflow and hooks
- Ticket transition and guardrails are enforced server-side.
- Side effects (activity logs + notifications) are in:
  - `src/hooks/tickets/afterChangeTicket.ts`
  - `src/hooks/tickets/createActivityLog.ts`

### Seed data
- Script: `npm run seed`
- File: `src/seed.ts`
- Creates demo manager/tenant/technician users and tickets in multiple statuses.

### Auth and route protection (recently completed)
- Payload REST route handler:
  - `src/app/api/[...slug]/route.ts`
- Server helpers:
  - `src/lib/payload.ts` (`server-only`, singleton Payload client)
  - `src/lib/auth.ts` (`server-only`, reads `payload-token`)
- Client providers:
  - `src/components/providers/AuthProvider.tsx`
  - `src/components/providers/QueryProvider.tsx`
  - Alias re-exports in `components/providers/*` for import consistency
- Auth pages:
  - `src/app/(app)/login/page.tsx`
  - `src/app/(app)/register/page.tsx`
- Middleware:
  - `middleware.ts`

## Important Auth/Middleware Notes
- Middleware is intentionally coarse:
  - checks only presence of `payload-token` cookie
  - blocks unauthenticated access to protected routes
  - redirects authenticated users away from `/login` and `/register`
- Middleware now excludes non-app routes at matcher level:
  - `/api`, `/admin`, `/_next/*`, `/media`, `favicon.ico`, and static files
- Redirect target is currently `/` (not `/dashboard`) to avoid 404 until dashboard page exists.
- Login `next` param is sanitized to prevent open redirects:
  - only internal paths are allowed
  - external/protocol-relative values fall back to `/`

## Known Mismatch to Be Aware Of
- Plan verification text for auth still says redirect to `/dashboard`, but implementation redirects to `/` because `/dashboard` route is not yet built.
- When `Layout & Dashboard` step is implemented and `/dashboard` exists, redirects can be switched back if desired.

## Current Gaps (Next Work)
- `Layout & Dashboard` step is pending:
  - app shell, role-aware nav, header, notification bell, dashboard page/cards/table
- Ticket UI steps are pending:
  - list, create form with upload, detail page, manager/technician actions
- Notifications page and final polish/testing are pending.

## Runbook
- Install: `npm install`
- Dev: `npm run dev`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`
- Seed (PowerShell example):
  - `$env:SEED_PASSWORD="ChangeMe-Seed-2026"; npm run seed`

## Environment Variables
- `PAYLOAD_SECRET` (recommended)
- `DATABASE_URL` (optional; defaults to `file:./payload.db`)
- `SEED_PASSWORD` (required for seed script)

## Practical Gotchas
- `src/pages/dashboard.tsx` exists from shadcn `dashboard-01` scaffold (pages router artifact).
  - Planned app implementation should live in `src/app/(app)/dashboard/page.tsx`.
- Keep server-only boundaries:
  - do not import `src/lib/payload.ts` or `src/lib/auth.ts` from client components.
- For activity log visibility, ensure log rows contain required denormalized fields expected by access filters.

## Suggested Reading Order
1. `payload.config.ts`
2. `src/collections/Tickets.ts`
3. `src/hooks/tickets/afterChangeTicket.ts`
4. `src/components/providers/AuthProvider.tsx`
5. `middleware.ts`
6. `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md`

