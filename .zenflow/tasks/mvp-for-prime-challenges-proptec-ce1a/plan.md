# Spec and build

## Configuration
- **Artifacts Path**: `.zenflow/tasks/mvp-for-prime-challenges-proptec-ce1a`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

If you are blocked and need user clarification, mark the current step with `[!]` in plan.md before stopping.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 82e0b19d-5668-4fbc-a37e-e11cebce8f3c -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.

Created `spec.md` with full technical specification:
- Complexity: **Hard**
- Stack: Next.js 15, Payload CMS v3, SQLite, Shadcn/UI, Tailwind CSS v4
- 5 Payload collections: Users, Tickets, ActivityLogs, Notifications, Media
- Role-based access control (tenant, manager, technician)
- Payload afterChange hooks for activity logs + notifications
- 11 implementation phases defined

---

### [x] Step: Project Bootstrap
<!-- chat-id: 4559cccb-b946-4d0d-8804-8f413c928d09 -->

Scaffold the base application from scratch.

- Initialize Next.js 15 project with TypeScript and App Router (`npx create-next-app@latest`)
- Install and configure Payload CMS v3 with SQLite adapter (`@payloadcms/db-sqlite`)
- Configure `payload.config.ts` with database, secret, and collection stubs
- Configure `next.config.ts` to use Payload's `withPayload` wrapper
- Set up Tailwind CSS v4 with `@tailwindcss/typography`
- Initialize shadcn/ui (`npx shadcn@latest init`)
- Add `dashboard-01` block: `npx shadcn@latest add dashboard-01`
- Add core shadcn components: `button card badge dialog form input select textarea table avatar dropdown-menu toast separator skeleton tabs`
- Create `.gitignore` with `node_modules/`, `.next/`, `dist/`, `*.log`, `media/`
- Verify: `npm run build` passes with no errors

---

### [ ] Step: Payload Collections & Access Control

Define all Payload CMS collections with fields and access control rules.

- `src/collections/Users.ts` — role field (tenant|manager|technician), unit, name, phone, avatar
- `src/collections/Media.ts` — image uploads with thumbnail+medium sizes, stored in `public/media`
- `src/collections/Tickets.ts` — all fields per spec; access control (tenant creates/reads own, manager reads all, technician reads assigned)
- `src/collections/ActivityLogs.ts` — locked to server-side creation; readable by relevant roles
- `src/collections/Notifications.ts` — per-user read; mark-read update access
- Register all collections in `payload.config.ts`
- Verify: `npm run typecheck` passes; Payload admin panel loads at `/admin`

---

### [ ] Step: Business Logic Hooks & Seed Script

Implement afterChange hooks and demo seed data.

- `src/hooks/tickets/afterChangeTicket.ts` — on create: activity log + manager notifications; on status change: activity log + technician/tenant notifications; on assignedTo change: activity log + technician notification; on priority change: activity log
- `src/hooks/tickets/createActivityLog.ts` — shared helper to insert activity-log records
- Attach hooks in `Tickets.ts` collection config
- `src/seed.ts` — creates 1 manager, 2 tenants, 2 technicians, 5 tickets in various statuses using Payload's local API
- Add `"seed": "tsx src/seed.ts"` script to `package.json`
- Verify: Run seed script; confirm records appear in Payload admin

---

### [ ] Step: Auth Flow & Middleware

Implement authentication and route protection.

- `src/lib/payload.ts` — `getPayloadClient()` singleton using `@payloadcms/next/utilities`
- `src/lib/auth.ts` — `getCurrentUser()` server helper reading `payload-token` cookie via Payload local API
- `src/components/providers/AuthProvider.tsx` — React context with `user`, `login()`, `logout()` using Payload REST API (`/api/users/login`, `/api/users/logout`, `/api/users/me`)
- `src/components/providers/QueryProvider.tsx` — React Query `QueryClientProvider`
- `middleware.ts` — check `payload-token` cookie; redirect unauthenticated users to `/login`; redirect authenticated users away from `/login`
- `src/app/(app)/login/page.tsx` — login form (email + password) with error handling
- `src/app/(app)/register/page.tsx` — tenant self-registration form
- Verify: Login/logout flow works; unauthenticated `/dashboard` redirects to `/login`

---

### [ ] Step: Layout & Dashboard

Build the app shell and role-based dashboard.

- `src/components/layout/AppShell.tsx` — sidebar + main content wrapper (mobile: bottom nav)
- `src/components/layout/Sidebar.tsx` — role-aware navigation links (different items per role)
- `src/components/layout/Header.tsx` — top bar with user avatar, notification bell, logout
- `src/components/notifications/NotificationBell.tsx` — bell icon with unread count badge; polls every 30s
- `src/app/(app)/layout.tsx` — wraps all app routes with `AuthProvider`, `QueryProvider`, `AppShell`
- `src/app/(app)/dashboard/page.tsx` — Server Component; fetches KPI stats; renders `StatsCards` + `RecentTickets`
- `src/components/dashboard/StatsCards.tsx` — cards: Open, Assigned, In Progress, Done counts
- `src/components/dashboard/RecentTickets.tsx` — last 5 tickets table
- Wire up `dashboard-01` shadcn block as layout foundation
- Verify: Dashboard renders for all three roles; stats reflect seeded data

---

### [ ] Step: Ticket List & Create Form

Build the ticket submission and listing UI.

- `src/components/tickets/StatusBadge.tsx` — color-coded status pill
- `src/components/tickets/PriorityBadge.tsx` — color-coded priority pill
- `src/components/tickets/TicketCard.tsx` — card component for ticket list
- `src/app/(app)/tickets/page.tsx` — role-filtered ticket list with shadcn DataTable; tenant sees own, manager sees all, technician sees assigned
- `src/app/(app)/tickets/new/page.tsx` — accessible only to tenants (redirect others)
- `src/components/tickets/TicketForm.tsx` — react-hook-form + zod; fields: title, description (textarea), category, priority, images (multi-file input with preview); submits to Payload REST API
- Verify: Tenant can create ticket with image upload; ticket appears in list immediately

---

### [ ] Step: Ticket Detail, Manager Actions & Technician Updates

Build the ticket detail page with role-specific action panels.

- `src/app/(app)/tickets/[id]/page.tsx` — full ticket detail page (Server Component for initial load)
- `src/components/tickets/TicketDetail.tsx` — renders ticket info, images, status badge, priority badge, assigned technician
- `src/components/tickets/ActivityLog.tsx` — timeline list of activity-log entries for the ticket
- `src/components/tickets/AssignTechnicianDialog.tsx` — shadcn Dialog; manager selects technician from dropdown, submits PATCH to Payload API; triggers hook
- Manager action panel: change status (select), change priority (select), assign technician (dialog) — only rendered if `role === 'manager'`
- Technician action panel: update status button (In Progress / Mark Done) — only rendered if `role === 'technician'` and ticket is assigned to them
- Verify: Manager assigns technician → activity log entry appears; technician marks done → status updates and resolvedAt set

---

### [ ] Step: Notifications Page & Final Polish

Complete notifications UI, mobile responsiveness, and final verification.

- `src/app/(app)/notifications/page.tsx` — list all notifications for current user; mark-all-read button; per-item mark-read on click linking to ticket
- Ensure `AppShell` sidebar collapses to icon-only or bottom nav on mobile (`md:` breakpoint)
- Add loading skeletons to ticket list and dashboard stats
- Add empty-state illustrations/messages for empty ticket lists
- Confirm `.gitignore` is complete (`node_modules`, `.next`, `*.log`, `public/media/*`, `.env*`)
- Run `npm run lint` — fix any lint errors
- Run `npm run typecheck` — fix any type errors
- Run `npm run build` — ensure production build succeeds
- Write `report.md` in artifacts path describing implementation, testing, and challenges
