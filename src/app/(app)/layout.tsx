import type { ReactNode } from "react";

import { AuthProvider } from "@/src/components/providers/AuthProvider";
import { QueryProvider } from "@/src/components/providers/QueryProvider";

export default function AppRoutesLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}

