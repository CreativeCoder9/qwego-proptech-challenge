import { redirect } from "next/navigation";

import { TicketForm } from "@/src/components/tickets/TicketForm";
import { getCurrentUser } from "@/src/lib/auth";

export default async function NewTicketPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    redirect("/login");
  }

  if (currentUser.role !== "tenant") {
    redirect("/tickets");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">New Maintenance Request</h1>
        <p className="text-sm text-muted-foreground">
          Submit an issue with details and photos so the manager can assign it quickly.
        </p>
      </section>
      <TicketForm />
    </div>
  );
}
