# Task Implementation Summary (PropTech MVP)

This file summarizes what is currently implemented and where core behavior lives.

## Scope Status

The planned MVP work under `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md` is implemented, including:

- Auth + RBAC
- Ticket create/list/detail flows
- Manager/technician action paths
- Activity logs and notifications
- Responsive and loading/empty-state polish

## Architecture at a Glance

- Frontend: Next.js 15 App Router (`src/app`)
- Backend/API: Payload CMS v3 via `src/app/api/[...slug]/route.ts`
- DB: SQLite (`payload.db` default)
- UI: shadcn/ui + Tailwind CSS
- Client data state: React Query (`QueryProvider`)

Core config files:

- `payload.config.ts`
- `next.config.ts`
- `middleware.ts`

## Role Model and Access

Roles:

- `tenant`
- `manager`
- `technician`
- `admin`

Primary access implementation:

- `src/collections/Users.ts`
- `src/collections/Tickets.ts`
- `src/collections/ActivityLogs.ts`
- `src/collections/Notifications.ts`
- `src/lib/access.ts`

## Ticket Workflow and Side Effects

Workflow enforcement:

- `src/collections/Tickets.ts`

Hook side effects:

- `src/hooks/tickets/afterChangeTicket.ts`
- `src/hooks/tickets/createActivityLog.ts`

Implemented side effects:

- On create: activity log + admin/manager notifications
- On assignment change: activity log + assignee notification
- On status change: activity log + role-targeted notifications
- On priority change: activity log

## Route and UI Map

Auth/shell:

- `/` (public landing page for non-authenticated users)
- `/login`, `/register`
- `src/app/(app)/layout.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`

Dashboard:

- `/dashboard`
- `src/components/dashboard/StatsCards.tsx`
- `src/components/dashboard/RecentTickets.tsx`

Tickets:

- `/tickets`
- `/tickets/new`
- `/tickets/[id]` (detail + actions + activity timeline)

Notifications:

- `/notifications`
- `src/components/notifications/NotificationBell.tsx`
- `src/components/notifications/NotificationsList.tsx`

People:

- `/users` (manager/admin)
- `src/components/users/UsersManagementPanel.tsx`

## Operational Notes

- Root layout `src/app/layout.tsx` is pass-through by design.
- Toaster is mounted in `src/app/(app)/layout.tsx`.
- Payload admin UI access is `admin` only.
- First user in an empty database is automatically assigned `admin`.
- Ticket create uploads media before creating ticket and performs best-effort cleanup on failure.
- Notification read updates are best-effort and should not block ticket navigation.

## Verification

Validation:

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment

Recommended env variables:

- `PAYLOAD_SECRET`
- `DATABASE_URL`

Template:

- `.env.example`

## First Files to Read

1. `docs/BUSINESS-LOGIC.md`
2. `payload.config.ts`
3. `src/collections/Tickets.ts`
4. `src/hooks/tickets/afterChangeTicket.ts`
5. `src/lib/auth.ts`
6. `middleware.ts`
