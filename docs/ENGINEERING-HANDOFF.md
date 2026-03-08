# Engineering Handoff - PropTech MVP

This file is a practical handoff for the next engineer continuing implementation.

## Project Snapshot
- Stack: Next.js 15 App Router + Payload CMS v3 + SQLite + shadcn/ui.
- Status: MVP implementation complete, including ticket list, creation form, details/actions, and notifications.
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

### Layout and dashboard (recently completed)
- App shell + role-aware navigation:
  - `src/components/layout/AppShell.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Header.tsx`
  - `src/components/layout/utils.ts`
- Dashboard widgets:
  - `src/components/dashboard/StatsCards.tsx`
  - `src/components/dashboard/RecentTickets.tsx`
- Notifications bell (polling unread count every 30s):
  - `src/components/notifications/NotificationBell.tsx`
- Server dashboard route:
  - `src/app/(app)/dashboard/page.tsx`

### Ticket list and create form (recently completed)
- Routes:
  - `src/app/(app)/tickets/page.tsx` (role-aware list + server pagination)
  - `src/app/(app)/tickets/new/page.tsx` (tenant-only create)
  - `src/app/(app)/tickets/[id]/page.tsx` (minimal detail route to support list navigation)
- Components:
  - `src/components/tickets/StatusBadge.tsx`
  - `src/components/tickets/PriorityBadge.tsx`
  - `src/components/tickets/TicketCard.tsx`
  - `src/components/tickets/TicketsDataTable.tsx`
  - `src/components/tickets/TicketForm.tsx`
  - `src/components/tickets/types.ts`
- Form stack:
  - `react-hook-form` + `@hookform/resolvers` + `zod`
- Upload behavior:
  - Images are uploaded to `/api/media` first, then ticket is created via `/api/tickets`.
  - On create failure after upload, best-effort cleanup deletes uploaded media records to reduce orphaned files.

## Important Auth/Middleware Notes
- Middleware is intentionally coarse:
  - checks only presence of `payload-token` cookie
  - blocks unauthenticated access to protected routes
  - redirects authenticated users away from `/login` and `/register`
- Middleware now excludes non-app routes at matcher level:
  - `/api`, `/admin`, `/_next/*`, `/media`, `favicon.ico`, and static files
- Redirect target for authenticated users on auth pages is `/dashboard`.
- Login `next` param is sanitized to prevent open redirects:
  - only internal paths are allowed
  - external/protocol-relative values fall back to `/`
- Middleware special-case: unauthenticated requests to `/` get `next=/dashboard` to avoid an extra post-login redirect hop.

## Important Dashboard/RBAC Notes
- Dashboard reads from `tickets` intentionally use Payload local API with:
  - `overrideAccess: false`
  - `user: currentUser`
- This preserves centralized collection access control. Do not switch dashboard reads to `overrideAccess: true` without a strong reason and explicit safety guardrails.

## Current Gaps (Next Work)
- The core MVP implementation is complete. Future enhancements could include reporting features, performance optimizations, and integrations.

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
- Remove or avoid introducing App Router/Pages Router route conflicts for the same path (e.g., both `app/(app)/dashboard/page.tsx` and `pages/dashboard.tsx`).
- Keep server-only boundaries:
  - do not import `src/lib/payload.ts` or `src/lib/auth.ts` from client components.
- For activity log visibility, ensure log rows contain required denormalized fields expected by access filters.
- Ticket list query intentionally uses role-aware depth:
  - manager: `depth: 1` (needs relation names)
  - tenant/technician: `depth: 0` (lighter payload and avoids expecting restricted user relation data)
- Ticket table columns intentionally hide `Tenant`/`Technician` for non-managers to match current `users` read access model.

## Suggested Reading Order
1. `payload.config.ts`
2. `src/collections/Tickets.ts`
3. `src/hooks/tickets/afterChangeTicket.ts`
4. `src/components/providers/AuthProvider.tsx`
5. `middleware.ts`
6. `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md`
