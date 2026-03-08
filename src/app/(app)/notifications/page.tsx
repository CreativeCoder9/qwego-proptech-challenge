import { redirect } from "next/navigation";

import { NotificationsList } from "@/src/components/notifications/NotificationsList";
import { getCurrentUser } from "@/src/lib/auth";

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">See updates on ticket assignments and status changes.</p>
      </section>

      <NotificationsList />
    </div>
  );
}
