"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  House,
  PlusSquare,
  Ticket,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, isActivePath } from "@/src/components/layout/utils";

type UserRole = "tenant" | "manager" | "technician";

type AppUser = {
  id: number | string;
  name?: string;
  email?: string;
  role?: UserRole;
};

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const FALLBACK_ROLE: UserRole = "tenant";

const NAV_BY_ROLE: Record<UserRole, NavigationItem[]> = {
  manager: [
    { href: "/dashboard", icon: House, label: "Dashboard" },
    { href: "/tickets", icon: Ticket, label: "All Tickets" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
  ],
  technician: [
    { href: "/dashboard", icon: House, label: "Dashboard" },
    { href: "/tickets", icon: Wrench, label: "Assigned Tasks" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
  ],
  tenant: [
    { href: "/dashboard", icon: House, label: "Dashboard" },
    { href: "/tickets", icon: ClipboardList, label: "My Tickets" },
    { href: "/tickets/new", icon: PlusSquare, label: "New Request" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
  ],
};

export const getNavigationForRole = (role?: UserRole) => NAV_BY_ROLE[role ?? FALLBACK_ROLE];

export const AppSidebar = ({ user }: { user: AppUser }) => {
  const pathname = usePathname() ?? "/";
  const navItems = getNavigationForRole(user.role);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="font-semibold" size="lg" render={<Link href="/dashboard" />}>
              <House className="size-4" />
              <span>Property Manager</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActivePath(pathname, item.href)}
                    render={<Link href={item.href} />}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-xs group-data-[collapsible=icon]:hidden">
            <p className="truncate font-medium">{user.name ?? user.email ?? "User"}</p>
            <p className="truncate text-sidebar-foreground/70">{user.role ?? FALLBACK_ROLE}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export type { AppUser, UserRole };
