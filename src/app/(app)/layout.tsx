import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppShell } from "@/src/components/layout/AppShell";
import { getCurrentUser } from "@/src/lib/auth";

export default async function AppRoutesLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <QueryProvider>
      <AuthProvider>
        <AppShell user={user}>{children}</AppShell>
      </AuthProvider>
    </QueryProvider>
  );
}
