# Implementation Notes

## Context

This repository implements the **Prime Challenges PropTech full-stack MVP** using:

- Next.js 15 (App Router)
- Payload CMS v3 (embedded into Next)
- SQLite (`@payloadcms/db-sqlite`)
- shadcn/ui components (including `dashboard-01`)
- Tailwind CSS v4 + typography plugin

## Current Progress Snapshot

Based on `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md`:

- `Technical Specification`: complete
- `Project Bootstrap`: complete
- `Payload Collections & Access Control`: complete
- `Business Logic Hooks & Seed Script`: complete
- `Auth Flow & Middleware`: complete
- `Layout & Dashboard`: complete
- `Ticket List & Create Form`: complete
- `Ticket Details & Actions`: complete
- `Notifications & Polish`: complete

## Key Architecture Decisions

## Backend and CMS

- Payload is configured in [payload.config.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/payload.config.ts).
- Database defaults to local SQLite file: `file:./payload.db`.
- Payload auth-enabled collection is `users` (admin user source).
- Registered collections:
  - `users`
  - `media`
  - `tickets`
  - `activity-logs`
  - `notifications`

## Access Model (implemented in collection configs)

- `users`:
  - manager can read/update/delete any user
  - non-manager can read/update only self
  - `role` field can only be set/updated by manager (field-level access)
- `tickets`:
  - tenant can create
  - manager reads/updates all
  - tenant reads own (`tenant == req.user.id`)
  - technician reads/updates assigned (`assignedTo == req.user.id`)
  - delete disabled
  - workflow guardrails in hooks:
    - tenant create is normalized to own tenant id and `status=open`
    - status transitions enforced: `open -> assigned -> in-progress -> done`
    - technician cannot update manager-owned fields
    - `resolvedAt` is set automatically when status is changed to `done`
- `activity-logs`:
  - read-only collection (no create/update/delete from clients)
  - manager reads all
  - tenant/technician reads are filtered by denormalized fields on log doc (`tenant`, `assignedTo`)
- `notifications`:
  - users read/update only their own notifications (`recipient == req.user.id`)
  - create/delete blocked from clients
- `media`:
  - authenticated create/read
  - manager update/delete
  - upload config writes to `media` (not under Next `public/`) and generates `thumbnail` + `medium`

## Security-Sensitive Notes

- Media files are intentionally not stored in `public/` to avoid bypassing Payload access rules via direct static URLs.
- Ticket mutation authorization is enforced both by collection access and by `beforeChange` hook validation.
- `activity-logs.create` and `notifications.create` are server-only, intended for future hook-driven writes.

## Shared Access Utilities

- Role/user helpers are centralized in:
  - [src/lib/access.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/lib/access.ts)
- This avoids per-collection drift in role checks and relationship-id normalization.

## Frontend/UI

- shadcn initialized via `components.json`.
- App source is under `src/app`.
- Shared UI components live under `components/ui`.
- Implemented shell/dashboard components:
  - `src/components/layout/AppShell.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Header.tsx`
  - `src/components/layout/utils.ts`
  - `src/components/notifications/NotificationBell.tsx`
  - `src/components/dashboard/StatsCards.tsx`
  - `src/components/dashboard/RecentTickets.tsx`
- Dashboard route is server-rendered at `src/app/(app)/dashboard/page.tsx`.

## Ticket List and Create (Completed)

### New routes

- `src/app/(app)/tickets/page.tsx`
  - Server-rendered ticket list with role-aware copy and query strategy.
  - Uses Payload local API with `overrideAccess: false` and `user: currentUser`.
  - Uses server pagination (`PAGE_SIZE = 25`, `?page=` query param).
  - Uses role-aware query depth:
    - manager: `depth: 1` (to resolve tenant/technician names)
    - tenant/technician: `depth: 0` (lighter payload; avoids expecting restricted user relations)
- `src/app/(app)/tickets/new/page.tsx`
  - Tenant-only create page; non-tenant users are redirected to `/tickets`.
- `src/app/(app)/tickets/[id]/page.tsx`
  - Minimal detail page added to prevent 404s from list/card links.
  - This is intentionally lightweight and will be expanded in the dedicated ticket-detail step.

### New ticket UI components

- `src/components/tickets/StatusBadge.tsx`
- `src/components/tickets/PriorityBadge.tsx`
- `src/components/tickets/TicketCard.tsx` (mobile list cards)
- `src/components/tickets/TicketsDataTable.tsx` (desktop table)
- `src/components/tickets/TicketForm.tsx` (tenant create form)
- `src/components/tickets/types.ts` (shared ticket types/labels/date helpers)

### Form and upload behavior

- `TicketForm` uses:
  - `react-hook-form`
  - `@hookform/resolvers`
  - `zod`
- Create flow:
  1. Upload selected images to `/api/media`
  2. Submit ticket to `/api/tickets` with `images: [{ image: mediaId }]`
- Failure handling:
  - If ticket creation fails after media uploads succeed, client performs best-effort cleanup (`DELETE /api/media/:id`) to reduce orphaned media records.

### Role-based table columns

- Desktop table intentionally shows identity columns only for managers:
  - manager: shows `Tenant` and `Technician`
  - tenant/technician: hides those columns
- This aligns UI with current `users` collection read access (non-managers can read only self).

### Performance and correctness notes

- Ticket list avoids hard `limit: 100`; it now paginates server-side.
- Do not revert to broad `depth: 1` for all roles unless users access model is changed.
- Detail links in list/card now resolve (minimal `[id]` page exists), avoiding dead-end navigation.

## Dashboard Data Access (Important)

- Dashboard queries now run with Payload access control enabled:
  - `overrideAccess: false`
  - `user: currentUser`
- This is intentional and prevents accidental RBAC bypass in dashboard reads.
- Future dashboard/reporting queries should follow the same pattern unless there is a clear admin-only need and an explicit security review.

## Auth and Routing Notes (Important)

- Root route (`/`) redirects to `/dashboard` in `src/app/page.tsx`.
- Middleware now sets `next=/dashboard` when unauthenticated users hit `/` to avoid an extra redirect hop after login.
- `AppShell` enforces consistent protected-route behavior:
  - Auth pages (`/login`, `/register`) render without shell chrome.
  - Non-auth pages with missing user session trigger a client redirect to login with `next` param.

## Code Consistency Notes

- Shared layout helpers were centralized:
  - `getInitials`
  - `isActivePath`
- Avoid reintroducing duplicates in header/sidebar/shell components.

## Encoding / Tooling Notes

- New TS/TSX files were normalized to UTF-8 without BOM.
- Keep files BOM-free to avoid formatter/linter churn across environments.

## Important File Map

- Core config:
  - [package.json](/C:/Users/suman/DevDrive/qwego-proptech-challenge/package.json)
  - [next.config.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/next.config.ts)
  - [payload.config.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/payload.config.ts)
  - [components.json](/C:/Users/suman/DevDrive/qwego-proptech-challenge/components.json)
  - [src/app/globals.css](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/app/globals.css)
- Collections:
  - [src/collections/Users.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/collections/Users.ts)
  - [src/collections/Media.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/collections/Media.ts)
  - [src/collections/Tickets.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/collections/Tickets.ts)
  - [src/collections/ActivityLogs.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/collections/ActivityLogs.ts)
  - [src/collections/Notifications.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/collections/Notifications.ts)
  - [src/lib/access.ts](/C:/Users/suman/DevDrive/qwego-proptech-challenge/src/lib/access.ts)

## Planned but Not Yet Implemented

The core MVP scope from `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a/plan.md` is complete.
