# Known Gotchas

## 1) Next.js and Payload version compatibility

- `@payloadcms/next@3.79.0` did not resolve cleanly with latest Next 15 patch at bootstrap time.
- Current pinned compatible version is `next@15.4.11`.
- If upgrading Next/Payload, test install + `npm run build` immediately.

## 2) shadcn `toast` registry item

- `@shadcn/toast` was not available in the selected registry style (`base-nova`).
- `@shadcn/sonner` is used instead.
- Compatibility shim exists in `components/ui/toast.tsx` (`export { toast } from "sonner"`).

## 3) Dashboard block scaffold location

- `dashboard-01` scaffold produced a pages-router file (`src/pages/dashboard.tsx`) and required `src/pages/data.json`.
- This coexists with App Router (`src/app`).
- Before building final app routes, decide whether to:
  - migrate dashboard components fully into `src/app`, or
  - keep pages route intentionally for the demo dashboard.

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
