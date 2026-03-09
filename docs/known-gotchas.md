# Known Gotchas

## 1) Next.js and Payload version compatibility

- `@payloadcms/next@3.79.0` did not resolve cleanly with latest Next 15 patch at bootstrap time.
- Current pinned compatible version is `next@15.4.11`.
- If upgrading Next/Payload, test install + `npm run build` immediately.

## 2) shadcn `toast` registry item

- `@shadcn/toast` was not available in the selected registry style (`base-nova`).
- `@shadcn/sonner` is used instead.
- Compatibility shim exists in `components/ui/toast.tsx` (`export { toast } from "sonner"`).

## 3) Route conflicts between App Router and Pages Router

- Next.js build fails if the same route exists in both routers (for example `app/(app)/dashboard/page.tsx` and `pages/dashboard.tsx`).
- Keep dashboard in App Router only (`src/app/(app)/dashboard/page.tsx`) for this project.

## 4) ESLint config and Next plugin warning

- Current `eslint.config.mjs` is minimal to avoid import compatibility errors from `eslint-config-next` flat config usage.
- `next build` may warn: Next.js plugin not detected in ESLint config.
- If you tighten linting later, reintroduce Next flat config carefully and verify with:
  - `npm run lint`
  - `npm run build`

## 5) Multiple lockfile warning (machine-specific)

- `next build` can warn if it detects another lockfile outside repo (e.g. user profile root).
- This warning does not block build; it is environment-specific.

## 6) Access control caveat to revisit

- `users.create` is currently open (`() => true`) while `role` field create/update is manager-only.
- This supports self-registration defaults, but registration UX and server-side role guarantees should be verified when auth flow is implemented.
- Current register page only creates tenant accounts, but open `users.create` still means API-level hardening should remain a review item.

## 7) Activity log writes must include denormalized access fields

- `activity-logs` read access for tenant/technician relies on `tenant` and `assignedTo` fields on each log row.
- Future hooks/services that create activity logs must set both fields, or non-manager users may not see relevant logs.

## 8) Ticket status transitions are now strict

- `tickets` enforces `open -> assigned -> in-progress -> done`, plus `open -> done`.
- Invalid jumps still fail with validation errors (for example `assigned -> done`).
- If product wants manager override transitions later, this must be changed explicitly in `src/collections/Tickets.ts`.

## 9) Dashboard reads must respect collection access rules

- For ticket reads on dashboard, use Payload local API with:
  - `overrideAccess: false`
  - `user: currentUser`
- Avoid `overrideAccess: true` for user-facing dashboard queries, otherwise RBAC depends on ad-hoc filters and is easier to break.

## 10) Ticket list route currently has a minimal `[id]` detail page

- `src/app/(app)/tickets/[id]/page.tsx` is now a full detail route with:
  - details card
  - manager actions (assign technician, update status/priority)
  - technician actions (progress assigned ticket)
  - activity timeline
- If you expand ticket actions, keep logic aligned with server validations in `src/collections/Tickets.ts`.

## 11) Ticket create flow performs media cleanup on failure

- `TicketForm` uploads media first, then creates the ticket.
- If ticket creation fails after uploads, it attempts best-effort cleanup with `DELETE /api/media/:id`.
- This cleanup is client-side and non-transactional; there is still a small residual orphan risk on network/process interruption.

## 12) Root layout is pass-through by design

- `src/app/layout.tsx` does not render app chrome or toaster.
- The user-facing shell and toaster are in `src/app/(app)/layout.tsx`.
- If UI suddenly appears missing, confirm you are editing the correct route-group layout.

## 13) Middleware auth check is cookie-presence only

- `middleware.ts` checks whether `payload-token` exists, not whether it is still valid.
- Authoritative auth is still enforced server-side by Payload when routes actually execute.
- Keep this distinction in mind when debugging redirect vs API authorization behavior.
