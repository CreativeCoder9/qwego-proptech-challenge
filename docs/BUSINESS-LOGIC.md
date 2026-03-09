# Business Logic Reference

This document is the source of truth for database-facing rules and core workflow behavior.

## Stack and Runtime Boundaries

- Data/API layer: Payload CMS v3 local API and REST routes mounted at `src/app/api/[...slug]/route.ts`
- Database: SQLite (`payload.db` by default)
- Auth: Payload auth on `users` collection, session cookie `payload-token`
- Server utilities:
  - `src/lib/payload.ts` for singleton Payload client
  - `src/lib/auth.ts` for current user resolution from cookie
  - `src/lib/access.ts` for role checks and relation id normalization

## Collections and Intent

- `users`: identity, auth, role, profile fields
- `tickets`: core maintenance request entity and workflow state
- `activity-logs`: immutable audit/event trail for ticket changes
- `notifications`: user-facing updates related to ticket events
- `media`: uploaded ticket images

Collection registration is in `payload.config.ts`.

## Role Model

- `tenant`
- `manager`
- `technician`

All role predicates are centralized in `src/lib/access.ts`.

## Access Rules by Collection

### users (`src/collections/Users.ts`)

- `create`: open (`true`) for self-registration
- `read`:
  - manager: all users
  - others: only self (`id == req.user.id`)
- `update`:
  - manager: all users
  - others: only self
- `delete`: manager only
- Field-level: `role` is create/update manager-only

Effectively, non-managers cannot self-promote by setting `role`.

### tickets (`src/collections/Tickets.ts`)

- `create`: tenant only
- `read`:
  - manager: all tickets
  - tenant: own tickets (`tenant == req.user.id`)
  - technician: assigned tickets (`assignedTo == req.user.id`)
- `update`:
  - manager: all tickets
  - technician: assigned tickets
  - tenant: none
- `delete`: disabled

### activity-logs (`src/collections/ActivityLogs.ts`)

- `create/update/delete`: disabled from clients
- `read`:
  - manager: all logs
  - tenant: logs where `tenant == req.user.id`
  - technician: logs where `assignedTo == req.user.id`

Note: visibility for tenant/technician depends on denormalized `tenant` and `assignedTo` columns on each log row.

### notifications (`src/collections/Notifications.ts`)

- `create/delete`: disabled from clients
- `read/update`: recipient only (`recipient == req.user.id`)
- In practice, update is used to set `read: true`

### media (`src/collections/Media.ts`)

- `create/read`: authenticated users
- `update/delete`: manager only
- Upload constraints:
  - mime types: `image/jpeg`, `image/png`, `image/webp`
  - static dir: `media`
  - generated sizes: `thumbnail`, `medium`

## Ticket Workflow and State Machine

Ticket statuses:

- `open`
- `assigned`
- `in-progress`
- `done`

Allowed transitions (`src/collections/Tickets.ts`):

- `open -> assigned`
- `open -> done` (manager fast-close path)
- `assigned -> in-progress`
- `in-progress -> done`
- `done ->` terminal

Any other status jump throws a `ValidationError`.

### Pre-validation Behavior on Create

When a tenant creates a ticket:

- `tenant` is forced to `req.user.id`
- `status` is forced to `open`
- `assignedTo` is cleared

### Update Guardrails

For technicians:

- Must be the assigned technician on the original ticket
- Cannot reassign (`assignedTo` cannot change to another user)
- Cannot modify manager-owned fields:
  - `priority`, `tenant`, `title`, `description`, `category`, `images`, `unit`, `building`
- Can only progress status along allowed transition path

Assignment and status consistency checks:

- If assignment is newly added while status is `open`, status is auto-set to `assigned`
- Clearing `assignedTo` is only valid when status is `open`
- `assigned` requires `assignedTo`
- `in-progress` requires `assignedTo`
- `done` does not require `assignedTo` (supports direct `open -> done`)

Resolution timestamp:

- On transition to `done`, `resolvedAt` is set to current ISO timestamp
- `resolvedAt` is read-only for clients

## Hook-Driven Side Effects

Ticket side effects are centralized in:

- `src/hooks/tickets/afterChangeTicket.ts`
- helper: `src/hooks/tickets/createActivityLog.ts`

### On Ticket Create

- Activity log row with action `created`
- Notification of type `ticket-created` to all managers

### On Assignment Change

- Activity log row with action `assigned` and `details.from/to`
- Notification of type `ticket-assigned` to new assignee (if present)

### On Status Change

- Activity log row with action `status-changed` and `details.from/to`
- If status becomes `assigned` and a technician exists (and was not already notified), notify technician
- If status becomes `done`, notify tenant with `status-update`

### On Priority Change

- Activity log row with action `priority-changed` and `details.from/to`

## Frontend Flows That Rely on This Logic

- Ticket create (`src/components/tickets/TicketForm.tsx`):
  - uploads media first
  - creates ticket second
  - best-effort media cleanup on ticket create failure
- Ticket actions (`src/components/tickets/TicketActionsPanel.tsx` and `AssignTechnicianDialog.tsx`):
  - manager: assign technician, update status, update priority
  - technician: progress status on own assigned tickets
- Notifications UI (`src/components/notifications/NotificationsList.tsx`):
  - reads user notifications
  - sets `read=true` per notification or in bulk (client-driven loop)

## Data Integrity Notes

- Access control is enforced in Payload collection access plus ticket hook validation.
- Activity log correctness depends on using `createActivityLog` (or equivalent) that sets both `tenant` and `assignedTo`.
- Notifications and activity logs are intentionally immutable from normal client create/delete paths; they are system-generated.
