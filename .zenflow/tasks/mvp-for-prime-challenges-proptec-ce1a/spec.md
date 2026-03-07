# Technical Specification: PropTech Maintenance Management MVP

## Complexity Assessment

**Difficulty: Hard**

Justification:
- Greenfield full-stack application from scratch
- Payload CMS v3 embedded in Next.js App Router (monorepo pattern)
- Three distinct roles with different access scopes and UI flows
- File upload handling with image preview
- Activity log system with audit trail per ticket
- In-app notification system
- Status workflow machine (Open → Assigned → In Progress → Done)
- Mobile-first responsive UI

---

## Technical Context

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | Shadcn/UI + Tailwind CSS v4 |
| CMS / Backend | Payload CMS v3 (`@payloadcms/next`) |
| Database | SQLite via `@payloadcms/db-sqlite` |
| Auth | Payload built-in JWT auth (HTTP-only cookies) |
| File Storage | Local filesystem via `@payloadcms/plugin-cloud-storage` (local adapter) |
| Email | Nodemailer with Ethereal/SMTP stub (no paid API) |
| Runtime | Node.js v24 |
| Package Manager | npm |

### Key dependencies

```
payload@3
@payloadcms/next
@payloadcms/db-sqlite
@payloadcms/richtext-lexical
@payloadcms/ui
next@15
react@19
react-dom@19
tailwindcss@4
@tailwindcss/typography
shadcn (CLI only)
nodemailer
sharp (image processing for Payload)
```

---

## Data Model

### Collection: `users`

| Field | Type | Notes |
|---|---|---|
| email | email (built-in) | unique, indexed |
| password | password (built-in) | hashed |
| name | text | required |
| role | select | `tenant \| manager \| technician` |
| unit | text | optional, for tenants (e.g. "Apt 3B") |
| phone | text | optional |
| avatar | upload (media) | optional |
| createdAt | date (auto) | |
| updatedAt | date (auto) | |

### Collection: `tickets`

| Field | Type | Notes |
|---|---|---|
| title | text | required |
| description | richtext (Lexical) | required |
| images | array of upload (media) | optional, max 5 |
| status | select | `open \| assigned \| in-progress \| done` |
| priority | select | `low \| medium \| high \| critical` |
| category | select | `plumbing \| electrical \| hvac \| structural \| other` |
| tenant | relationship → users | required, auto-set to current user on create |
| assignedTo | relationship → users | technician only, set by manager |
| unit | text | auto-filled from tenant.unit |
| building | text | optional |
| resolvedAt | date | set when status → done |
| createdAt | date (auto) | |
| updatedAt | date (auto) | |

### Collection: `activity-logs`

| Field | Type | Notes |
|---|---|---|
| ticket | relationship → tickets | required, indexed |
| actor | relationship → users | who performed the action |
| action | select | `created \| assigned \| status-changed \| priority-changed \| comment-added` |
| details | json | e.g. `{ from: 'open', to: 'assigned', technician: '...' }` |
| message | text | human-readable summary |
| createdAt | date (auto) | |

### Collection: `notifications`

| Field | Type | Notes |
|---|---|---|
| recipient | relationship → users | required |
| ticket | relationship → tickets | optional |
| type | select | `ticket-created \| ticket-assigned \| status-update \| comment` |
| message | text | |
| read | checkbox | default false |
| createdAt | date (auto) | |

### Collection: `media`

Payload built-in `uploadCollectionSlug` with:
- `imageSizes` for thumbnail + medium
- `mimeTypes`: `['image/jpeg', 'image/png', 'image/webp']`
- `staticDir`: `public/media`
- `staticURL`: `/media`

---

## Access Control Rules

### Users collection
- **create**: public (registration) — only role `tenant` allowed on self-register
- **read self**: all authenticated
- **read others**: manager only (for technician assignment dropdown)
- **update self**: authenticated users
- **update others**: manager only

### Tickets collection
- **create**: authenticated (role = tenant only)
- **read own**: tenant (filter by `tenant === currentUser.id`)
- **read all**: manager, technician (technician sees only assigned)
- **update status/assignedTo/priority**: manager
- **update status (in-progress→done, assigned→in-progress)**: technician (own assigned)
- **delete**: none (soft-delete via status if needed)

### Activity Logs collection
- **create**: server-side only (via hooks, no direct API writes from client)
- **read**: manager (all), tenant (own ticket logs), technician (assigned ticket logs)

### Notifications collection
- **read own**: authenticated users filter by `recipient === currentUser.id`
- **update (mark read)**: recipient only
- **create**: server-side hooks only

### Media collection
- **create**: authenticated
- **read**: all authenticated

---

## Payload Hooks (Business Logic)

### `tickets` afterChange hook
Fires when a ticket is created or updated:

1. **On create**: 
   - Create activity-log: `action: 'created'`
   - Create notification for all managers

2. **On status change**:
   - Create activity-log: `action: 'status-changed'`, details `{ from, to }`
   - If status → `assigned`: notify the assigned technician
   - If status → `done`: set `resolvedAt`, notify tenant

3. **On `assignedTo` change**:
   - Create activity-log: `action: 'assigned'`
   - Create notification for assigned technician

4. **On priority change**:
   - Create activity-log: `action: 'priority-changed'`

---

## Application Routes & Pages

```
app/
├── (payload)/                  # Payload admin (auto-managed)
│   └── admin/[[...segments]]/  # Payload admin panel
├── (app)/                      # Frontend app routes
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Root redirect to /dashboard or /login
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Tenant self-registration
│   ├── dashboard/
│   │   └── page.tsx            # Role-based dashboard (dashboard-01 block)
│   ├── tickets/
│   │   ├── page.tsx            # Ticket list (role-filtered)
│   │   ├── new/
│   │   │   └── page.tsx        # Create ticket (tenant only)
│   │   └── [id]/
│   │       └── page.tsx        # Ticket detail + activity log + actions
│   └── notifications/
│       └── page.tsx            # Notification inbox
├── api/
│   └── [...slug]/
│       └── route.ts            # Payload REST API handler
└── (payload)/
    └── admin/
        └── [[...segments]]/
            └── page.tsx        # Payload admin UI
```

---

## Frontend Architecture

### Auth Flow
- Login via Payload's `/api/users/login` REST endpoint
- Auth state in a React Context (`AuthContext`) reading from `/api/users/me`
- Protected routes via middleware (`middleware.ts`) checking `payload-token` cookie
- Role-based redirect in middleware

### Key Frontend Components

```
components/
├── ui/                          # shadcn/ui generated components
├── layout/
│   ├── AppShell.tsx             # Sidebar + header wrapper
│   ├── Sidebar.tsx              # Role-aware navigation sidebar
│   └── Header.tsx               # Top bar with notifications bell
├── tickets/
│   ├── TicketCard.tsx           # Card for ticket list
│   ├── TicketForm.tsx           # Create/edit form with file upload
│   ├── TicketDetail.tsx         # Full ticket view
│   ├── StatusBadge.tsx          # Color-coded status pill
│   ├── PriorityBadge.tsx        # Color-coded priority pill
│   ├── ActivityLog.tsx          # Timeline of activity events
│   └── AssignTechnicianDialog.tsx  # Manager's assign modal
├── notifications/
│   └── NotificationBell.tsx     # Bell icon with unread count
├── dashboard/
│   ├── StatsCards.tsx           # KPI cards (open/assigned/done counts)
│   └── RecentTickets.tsx        # Recent activity table
└── providers/
    ├── AuthProvider.tsx          # Auth context
    └── QueryProvider.tsx         # React Query setup
```

### Data Fetching
- All API calls use the Payload REST API (`/api/...`)
- `@tanstack/react-query` for client-side data fetching + caching
- Server Components for initial data where possible (dashboard stats)

---

## UI Design Decisions

- **Mobile-first**: Sidebar collapses to bottom nav on mobile
- **Dashboard**: `dashboard-01` shadcn block for the main layout skeleton
- **Ticket list**: shadcn `DataTable` with server-side filtering
- **Ticket form**: shadcn `Form` + react-hook-form + zod validation
- **Image upload**: drag-and-drop with preview using native `<input type="file">`
- **Notifications**: in-app only (bell icon + notification page), poll every 30s
- **Status colors**:
  - `open` → gray
  - `assigned` → blue
  - `in-progress` → yellow/amber
  - `done` → green
- **Priority colors**:
  - `low` → gray
  - `medium` → yellow
  - `high` → orange
  - `critical` → red

---

## File Structure (Full)

```
qwego-proptech-challenge/
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── payload.config.ts            # Payload CMS root config
├── tailwind.config.ts
├── middleware.ts                # Auth + route protection
├── components.json              # shadcn config
├── src/
│   ├── app/
│   │   ├── (payload)/
│   │   │   └── admin/[[...segments]]/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tickets/page.tsx
│   │   │   ├── tickets/new/page.tsx
│   │   │   └── tickets/[id]/page.tsx
│   │   └── api/[...slug]/route.ts
│   ├── collections/
│   │   ├── Users.ts
│   │   ├── Tickets.ts
│   │   ├── ActivityLogs.ts
│   │   ├── Notifications.ts
│   │   └── Media.ts
│   ├── hooks/
│   │   └── tickets/
│   │       ├── afterChangeTicket.ts
│   │       └── createActivityLog.ts
│   ├── lib/
│   │   ├── payload.ts           # getPayloadClient singleton
│   │   ├── auth.ts              # auth helpers (getCurrentUser)
│   │   └── utils.ts             # cn() and other utils
│   ├── components/
│   │   ├── ui/                  # shadcn generated
│   │   ├── layout/
│   │   ├── tickets/
│   │   ├── dashboard/
│   │   └── providers/
│   └── types/
│       └── index.ts             # Payload generated types + custom
├── public/
│   └── media/                   # Local file uploads
└── .zenflow/
    └── tasks/...
```

---

## Seed Data

A `seed.ts` script (or Payload's `onInit`) will create:
- 1 manager: `manager@demo.com` / `password123`
- 2 tenants: `tenant1@demo.com`, `tenant2@demo.com`
- 2 technicians: `tech1@demo.com`, `tech2@demo.com`
- 5 sample tickets in various statuses

---

## Verification Approach

1. **Lint**: `npm run lint` (Next.js ESLint config)
2. **Type-check**: `npm run typecheck` → `tsc --noEmit`
3. **Build**: `npm run build` → verifies no compilation errors
4. **Manual testing**:
   - Tenant: register, login, create ticket with image upload
   - Manager: view all tickets, assign technician, change priority/status
   - Technician: view assigned tickets, update status to in-progress → done
   - Verify activity log updates on every action
   - Verify notifications appear for relevant role

No unit test framework is included in MVP scope (time constraint); the primary verification is TypeScript type-safety + build success + manual QA.

---

## Implementation Phases (for plan.md)

1. **Project Bootstrap** — scaffold Next.js + Payload CMS + Tailwind + shadcn
2. **Payload Collections** — Users, Tickets, Media, ActivityLogs, Notifications with access control
3. **Business Logic Hooks** — afterChange hooks for activity logs + notifications
4. **Seed Script** — demo users and tickets
5. **Auth Flow** — login, register, middleware route protection, AuthContext
6. **Dashboard & Layout** — AppShell, Sidebar, Header, dashboard-01 block with stats
7. **Ticket Management UI** — list page, create form (with image upload), detail page
8. **Manager Actions** — assign technician dialog, status/priority controls
9. **Technician View** — assigned ticket list, progress update controls
10. **Notifications UI** — notification bell, notification inbox page
11. **Polish & Seed Integration** — mobile responsiveness, seed data, .gitignore, final lint/build
