"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CircleDot } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type NotificationType = "comment" | "status-update" | "ticket-assigned" | "ticket-created";
type Relation = number | string | { id?: number | string } | null | undefined;

type NotificationDoc = {
  id: number | string;
  createdAt?: string;
  message: string;
  read?: boolean;
  ticket?: Relation;
  type: NotificationType;
};

type NotificationsResponse = {
  docs?: NotificationDoc[];
};

const TYPE_LABELS: Record<NotificationType, string> = {
  comment: "Comment",
  "status-update": "Status Update",
  "ticket-assigned": "Ticket Assigned",
  "ticket-created": "Ticket Created",
};

const resolveRelationId = (value: Relation): number | string | undefined => {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "object") {
    return value.id;
  }

  return value;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getNotifications = async (): Promise<NotificationDoc[]> => {
  const response = await fetch("/api/notifications?depth=0&limit=100&sort=-createdAt", {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Unable to load notifications.");
  }

  const payload = (await response.json()) as NotificationsResponse;
  return payload.docs ?? [];
};

const markNotificationAsRead = async (notificationId: number | string) => {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    body: JSON.stringify({ read: true }),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Unable to update notification.");
  }
};

export const NotificationsList = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeNotificationId, setActiveNotificationId] = useState<number | string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const {
    data: notifications = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: getNotifications,
    queryKey: ["notifications", "list"],
  });

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const onMarkAllRead = async () => {
    const unreadIds = unreadNotifications.map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    setIsMarkingAll(true);

    try {
      const results = await Promise.allSettled(unreadIds.map((id) => markNotificationAsRead(id)));
      const failedCount = results.filter((result) => result.status === "rejected").length;

      if (failedCount > 0) {
        toast.error(
          `Marked ${unreadIds.length - failedCount} of ${unreadIds.length} notifications as read. Please retry.`,
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const onOpenTicket = async (notification: NotificationDoc) => {
    const ticketId = resolveRelationId(notification.ticket);

    if (!ticketId) {
      return;
    }

    setActiveNotificationId(notification.id);

    try {
      if (!notification.read) {
        try {
          await markReadMutation.mutateAsync(notification.id);
        } catch {
          toast.error("Couldn't mark notification as read.");
        }
      }
    } finally {
      setActiveNotificationId(null);
    }

    router.push(`/tickets/${ticketId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load notifications</CardTitle>
          <CardDescription>Refresh and try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void refetch()} type="button" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          disabled={unreadNotifications.length === 0 || isMarkingAll}
          onClick={() => void onMarkAllRead()}
          type="button"
          variant="outline"
        >
          <CheckCheck className="size-4" />
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Bell className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground">You will see ticket updates here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isBusy =
              markReadMutation.isPending && activeNotificationId != null && activeNotificationId === notification.id;
            const hasTicket = Boolean(resolveRelationId(notification.ticket));

            return (
              <Card
                className={!notification.read ? "border-primary/30 bg-primary/5" : undefined}
                key={String(notification.id)}
              >
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!notification.read ? <CircleDot className="size-3 text-primary" /> : null}
                      <p className="text-xs font-medium text-muted-foreground">{TYPE_LABELS[notification.type]}</p>
                    </div>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  <Button
                    disabled={!hasTicket || isBusy}
                    onClick={() => void onOpenTicket(notification)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Open Ticket
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
