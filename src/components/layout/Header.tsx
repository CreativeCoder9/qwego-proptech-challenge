"use client";

import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/components/providers/AuthProvider";

import { NotificationBell } from "@/src/components/notifications/NotificationBell";
import type { AppUser } from "@/src/components/layout/Sidebar";
import { getInitials } from "@/src/components/layout/utils";

export const Header = ({ user: initialUser }: { user: AppUser }) => {
  const router = useRouter();
  const { isLoading, logout, user } = useAuth();

  const resolvedUser = user ?? initialUser;

  const onLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mx-1 h-4" orientation="vertical" />
          <div>
            <p className="text-sm font-semibold">Maintenance Portal</p>
            <p className="text-xs text-muted-foreground">{resolvedUser.role ?? "tenant"} view</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{getInitials(resolvedUser.name, resolvedUser.email)}</AvatarFallback>
          </Avatar>
          <Button disabled={isLoading} onClick={onLogout} size="sm" variant="outline">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
