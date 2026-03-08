import type { ReactNode } from "react";

/* Root layout is a simple pass-through.
 * The actual <html>/<body> tags are rendered by each route group's own layout:
 * - (app)/layout.tsx for the frontend
 * - (payload)/layout.tsx for the Payload CMS admin (via Payload's RootLayout)
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
