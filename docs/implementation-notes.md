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
- Remaining app/business-logic/UI steps are still pending

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
- Dashboard block output is currently present in `src/pages/dashboard.tsx` (from shadcn block scaffold), with data in `src/pages/data.json`.
- Shared UI components live under `components/ui`.

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

The following are still pending and should be tracked against plan/spec docs:

- Ticket lifecycle afterChange hooks for activity/notification automation
- Seed script for demo users/tickets
- Auth provider + middleware-protected app routes
- Role-specific dashboard and ticket workflows (create/assign/progress/done)
- Notifications page UX and final polish/testing/reporting
