# Implementation Notes

## Context

This repository implements a full-stack PropTech MVP using:

- Next.js 15 (App Router)
- Payload CMS v3
- SQLite (`@payloadcms/db-sqlite`)
- shadcn/ui + Tailwind CSS v4

## Current State

The planned MVP scope under `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md` is implemented:

- Auth + middleware + protected app shell
- Dashboard (RBAC-aware ticket stats and recent tickets)
- Public landing page (`/`) for non-authenticated users
- Ticket create/list/detail flows
- Manager/technician ticket actions
- Manager/admin People management for tenant and technician accounts
- Activity logs and notifications wired from ticket hooks
- Responsive states (loading, empty, mobile-friendly layouts)

## Architecture Decisions

## Backend/CMS

- Payload config: `payload.config.ts`
- Collections:
  - `users`
  - `media`
  - `tickets`
  - `activity-logs`
  - `notifications`
- Database defaults to local SQLite (`file:./payload.db`) when `DATABASE_URL` is not set.

## Access Control Strategy

- Collection-level and field-level access live in `src/collections/*`.
- Shared role helpers are centralized in `src/lib/access.ts`.
- User-facing server queries intentionally use:
  - `overrideAccess: false`
  - `user: currentUser`

This keeps RBAC logic in one place instead of duplicating ad-hoc filters in route code.

## Ticket Domain Rules

Key constraints are enforced in `src/collections/Tickets.ts`:

- Status transition chain is strict:
  - `open -> assigned -> in-progress -> done`
  - `open -> done` (manager fast-close)
- Tenant create is normalized server-side:
  - `tenant = req.user.id`
  - `status = open`
  - `assignedTo = undefined`
- Technician update guardrails:
  - only assigned technician can update
  - cannot reassign
  - cannot mutate manager-owned fields
- Status/assignment consistency is enforced (`assigned` and `in-progress` require assignee; `done` can be direct from `open`).
- `resolvedAt` is set automatically when status changes to `done`.

Side effects are hook-driven in `src/hooks/tickets/afterChangeTicket.ts`:

- activity log creation
- admin/manager notifications on ticket creation
- technician notifications on assignment
- tenant notifications on completion

## Frontend and Routing

- API passthrough route: `src/app/api/[...slug]/route.ts`
- Route protection:
  - middleware blocks unauthenticated access to protected routes
  - public pages are `/`, `/login`, and `/register`
  - authenticated users are redirected away from public auth pages and `/` to `/dashboard`
- Protected shell:
  - `src/components/layout/AppShell.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Header.tsx`
- Route groups:
  - `src/app/(app)` for user-facing app
  - `src/app/(payload)` for Payload admin

## Users and Admin Bootstrapping

- Roles are `tenant | technician | manager | admin`.
- Payload admin portal access is `admin` only.
- First created user in an empty DB is forced to `admin`.
- Managers can create/update/delete tenant and technician users via `/users`.

## Important Practical Notes

- Root `src/app/layout.tsx` is pass-through; `<html>/<body>` are rendered in route-group layouts.
- Notification toaster is mounted in `src/app/(app)/layout.tsx`.
- Ticket create flow uploads media first and performs best-effort cleanup on create failure.
- Notification read updates are intentionally best-effort and should not block ticket navigation.

## File Map (High Signal)

- `payload.config.ts`
- `src/collections/Tickets.ts`
- `src/hooks/tickets/afterChangeTicket.ts`
- `src/lib/auth.ts`
- `middleware.ts`
- `src/components/tickets/TicketActionsPanel.tsx`
- `src/components/notifications/NotificationsList.tsx`
- `docs/BUSINESS-LOGIC.md`
