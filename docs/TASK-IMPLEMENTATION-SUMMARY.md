# Task Implementation Summary (PropTech MVP)

This document captures the important implementation details for the completed challenge scope so future engineers can onboard quickly.

## Scope Status

All planned implementation steps in `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md` are marked complete, including:

- Auth + RBAC
- Ticket create/list/detail + manager/technician actions
- Activity logs
- Notifications page and bell
- Final polish (loading states, empty states, responsiveness, lint/typecheck/build)

## Architecture at a Glance

- Frontend: Next.js 15 App Router (`src/app`)
- Backend/CMS/API: Payload CMS v3 (mounted via `src/app/api/[...slug]/route.ts`)
- DB: SQLite (`payload.db`)
- UI: shadcn/ui + Tailwind CSS
- State/data on client: React Query (`QueryProvider`)

Core configuration:

- `payload.config.ts`
- `next.config.ts`
- `middleware.ts`

## Role Model and Access

Roles: `tenant | manager | technician`

Primary collection access is implemented in:

- `src/collections/Users.ts`
- `src/collections/Tickets.ts`
- `src/collections/ActivityLogs.ts`
- `src/collections/Notifications.ts`
- `src/lib/access.ts`

Access model highlights:

- Tenant: create/read own tickets
- Manager: read/update all tickets, assign/update workflow
- Technician: read/update assigned tickets
- Notifications: user can read/update only own notifications
- Activity logs: server-driven writes; role-filtered reads

## Important Workflow Logic

Ticket side effects are centralized in:

- `src/hooks/tickets/afterChangeTicket.ts`
- `src/hooks/tickets/createActivityLog.ts`

Implemented behavior:

- On ticket creation: activity log + manager notifications
- On assignment changes: activity log + technician notification
- On status changes: activity log + recipient notifications (technician/tenant as applicable)
- On priority changes: activity log

## UI and Route Map

Auth and shell:

- `/login`, `/register`
- protected shell in `src/app/(app)/layout.tsx`
- app chrome:
  - `src/components/layout/AppShell.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Header.tsx`

Dashboard:

- `/dashboard`
- `src/components/dashboard/StatsCards.tsx`
- `src/components/dashboard/RecentTickets.tsx`

Tickets:

- `/tickets` (role-aware list)
- `/tickets/new` (tenant-only create)
- `/tickets/[id]` (detail + action panels)

Notifications:

- Bell: `src/components/notifications/NotificationBell.tsx`
- Page: `/notifications`
- List/actions: `src/components/notifications/NotificationsList.tsx`

## Notifications Behavior (Important)

- "Open Ticket" does **not** block navigation if mark-read fails.
- Mark-read is best-effort; user gets toast feedback on failure.
- "Mark all as read" uses `Promise.allSettled` and reports partial failures.
- Global toaster is mounted in `src/app/layout.tsx`.

Why this matters:

- Notification read state is non-critical; ticket navigation should remain reliable.

## Loading, Empty States, and Mobile

Implemented polish:

- Route loading UI:
  - `src/app/(app)/dashboard/loading.tsx`
  - `src/app/(app)/tickets/loading.tsx`
- Empty-state UX for ticket/dash lists
- Mobile navigation pattern:
  - bottom nav on small screens
  - collapsible icon sidebar on `md+`

## Seed and Local Verification

Seed script:

- `npm run seed`
- File: `src/seed.ts`

Recommended validation commands:

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment and Ignore Rules

Required env:

- `PAYLOAD_SECRET`
- `DATABASE_URL` (defaults to local sqlite if omitted)

`.gitignore` notes:

- Includes generated artifacts (`node_modules`, `.next`, logs, db artifacts, etc.)
- Keeps template env files committed via:
  - `!.env.example`
  - `!.env.sample`

## High-Value Files to Read First

1. `payload.config.ts`
2. `src/collections/Tickets.ts`
3. `src/hooks/tickets/afterChangeTicket.ts`
4. `src/lib/auth.ts`
5. `middleware.ts`
6. `src/components/tickets/TicketActionsPanel.tsx`
7. `src/components/notifications/NotificationsList.tsx`

## Known Residual Risks / Follow-up Ideas

- Notification updates are currently client-driven over REST; a dedicated bulk-read endpoint could reduce request count.
- Build may show non-blocking environment warnings (lockfile/plugin detection) depending on machine setup.
- Add integration tests for role-based route access and ticket status transitions.
