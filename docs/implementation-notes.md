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
- `activity-logs`:
  - read-only collection (no create/update/delete from clients)
  - manager reads all, tenant reads own-ticket logs, technician reads assigned-ticket logs
- `notifications`:
  - users read/update only their own notifications (`recipient == req.user.id`)
  - create/delete blocked from clients
- `media`:
  - authenticated create/read
  - manager update/delete
  - upload config writes to `public/media` and generates `thumbnail` + `medium`

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

## Planned but Not Yet Implemented

The following are still pending and should be tracked against plan/spec docs:

- Ticket lifecycle hooks and activity/notification automation
- Seed script for demo users/tickets
- Auth provider + middleware-protected app routes
- Role-specific dashboard and ticket workflows (create/assign/progress/done)
- Notifications page UX and final polish/testing/reporting
