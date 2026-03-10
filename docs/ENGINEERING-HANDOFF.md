# Engineering Handoff - PropTech MVP

This handoff captures the current, implemented system behavior for the next engineer.

## Project Snapshot

- Stack: Next.js 15 App Router + Payload CMS v3 + SQLite + shadcn/ui
- Status: MVP feature scope is implemented end-to-end
- Scope references:
  - `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/spec.md`
  - `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md`

## Implemented Areas

### Data model and RBAC

- Collections in `payload.config.ts`:
  - `users`, `media`, `tickets`, `activity-logs`, `notifications`
- Role model:
  - `tenant | manager | technician | admin`
- Access logic:
  - `src/collections/Users.ts`
  - `src/collections/Tickets.ts`
  - `src/collections/ActivityLogs.ts`
  - `src/collections/Notifications.ts`
  - shared helpers in `src/lib/access.ts`

### Ticket workflow and side effects

- Server-side workflow enforcement in `src/collections/Tickets.ts`
- Hook side effects in:
  - `src/hooks/tickets/afterChangeTicket.ts`
  - `src/hooks/tickets/createActivityLog.ts`
- Includes:
  - strict status transitions
    - `open -> assigned -> in-progress -> done`
    - `open -> done` is allowed for admin/manager fast-close
  - assignment/status consistency checks
    - `in-progress` requires an assignee
    - `done` can be set without assignee from `open`
  - activity log generation
  - admin/manager/technician/tenant notifications based on event type

### Auth and route protection

- Payload REST route:
  - `src/app/api/[...slug]/route.ts`
- Server helpers:
  - `src/lib/payload.ts`
  - `src/lib/auth.ts`
- Client providers:
  - `src/components/providers/AuthProvider.tsx`
  - `src/components/providers/QueryProvider.tsx`
- Auth pages:
  - `src/app/(app)/login/page.tsx`
  - `src/app/(app)/register/page.tsx`
- Middleware:
  - `middleware.ts`

### App shell and product routes

- Shell/navigation:
  - `src/components/layout/AppShell.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Header.tsx`
- Dashboard:
  - `src/app/(app)/page.tsx` (public landing for non-authenticated users)
  - `src/app/(app)/dashboard/page.tsx`
  - `src/components/dashboard/StatsCards.tsx`
  - `src/components/dashboard/RecentTickets.tsx`
- Tickets:
  - `src/app/(app)/tickets/page.tsx`
  - `src/app/(app)/tickets/new/page.tsx`
  - `src/app/(app)/tickets/[id]/page.tsx`
  - `src/components/tickets/*`
- Notifications:
  - `src/app/(app)/notifications/page.tsx`
  - `src/components/notifications/NotificationBell.tsx`
  - `src/components/notifications/NotificationsList.tsx`
- People management:
  - `src/app/(app)/users/page.tsx`
  - `src/components/users/UsersManagementPanel.tsx`

## Important Runtime Notes

## Layout boundaries

- Root `src/app/layout.tsx` is pass-through.
- `<html>/<body>`, providers, and toaster are in `src/app/(app)/layout.tsx`.
- Payload admin layout is in route group `src/app/(payload)`.

## Middleware behavior

- Middleware treats `/`, `/login`, and `/register` as public pages.
- Unauthenticated users are redirected to `/login?next=...`.
- Authenticated users on `/` and auth pages are redirected to `/dashboard`.
- Authenticated users on auth pages are redirected to `/dashboard`.
- Middleware validates cookie presence, not token validity (server checks happen in Payload routes).

## Users management model

- Payload admin UI (`/admin`) is `admin` role only.
- First user in empty DB is auto-assigned `admin`.
- Managers can manage only tenant and technician users through app portal `/users`.

## Query safety pattern

For user-facing server reads, preserve:

- `overrideAccess: false`
- `user: currentUser`

This is how dashboard and tickets honor centralized RBAC.

## Local Ops

- Core env:
  - `PAYLOAD_SECRET`
  - `DATABASE_URL` (optional; defaults to local sqlite path)

## Suggested Reading Order

1. `docs/BUSINESS-LOGIC.md`
2. `payload.config.ts`
3. `src/collections/Tickets.ts`
4. `src/hooks/tickets/afterChangeTicket.ts`
5. `src/lib/auth.ts`
6. `middleware.ts`
7. `src/components/tickets/TicketActionsPanel.tsx`
