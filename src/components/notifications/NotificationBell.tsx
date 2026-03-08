"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { buttonVariants } from "@/components/ui/button";

type NotificationsResponse = {
  totalDocs?: number;
};

const getUnreadCount = async (): Promise<number> => {
  const response = await fetch("/api/notifications?where[read][equals]=false&limit=1", {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok) {
    return 0;
  }

  const data = (await response.json()) as NotificationsResponse;
  return data.totalDocs ?? 0;
};

export const NotificationBell = () => {
  const { data: unreadCount = 0 } = useQuery({
    queryFn: getUnreadCount,
    queryKey: ["notifications", "unread-count"],
    refetchInterval: 30_000,
  });

  return (
    <Link
      aria-label="Notifications"
      className={`${buttonVariants({ size: "icon-sm", variant: "ghost" })} relative`}
      href="/notifications"
    >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
    </Link>
  );
};
