"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { Header } from "@/src/components/layout/Header";
import { AppSidebar, getNavigationForRole, type AppUser } from "@/src/components/layout/Sidebar";

type AppShellProps = {
  children: ReactNode;
  user: AppUser | null;
};

const AUTH_ROUTES = new Set(["/login", "/register"]);

const isActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const AppShell = ({ children, user }: AppShellProps) => {
  const pathname = usePathname() ?? "/";

  if (AUTH_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

  const navItems = getNavigationForRole(user.role);

  return (
    <SidebarProvider
      style={
        {
          "--header-height": "calc(var(--spacing) * 12)",
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as CSSProperties
      }
    >
      <AppSidebar user={user} />

      <SidebarInset>
        <Header user={user} />
        <div className="flex flex-1 flex-col px-4 py-4 pb-24 lg:px-6 lg:py-6 md:pb-6">{children}</div>
      </SidebarInset>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <ul className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.slice(0, 4).map((item) => (
            <li key={item.href}>
              <Link
                className={[
                  "flex min-h-14 flex-col items-center justify-center rounded-md text-[11px] font-medium",
                  isActive(pathname, item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                ].join(" ")}
                href={item.href}
              >
                <item.icon className="mb-1 size-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </SidebarProvider>
  );
};
