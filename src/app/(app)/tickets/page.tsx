import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TicketCard } from "@/src/components/tickets/TicketCard";
import { TicketsDataTable } from "@/src/components/tickets/TicketsDataTable";
import { type TicketListItem, type UserRole } from "@/src/components/tickets/types";
import { getCurrentUser } from "@/src/lib/auth";
import { getPayloadClient } from "@/src/lib/payload";

type TicketDoc = {
  id: number | string;
  assignedTo?: { email?: string; id?: number | string; name?: string } | number | string | null;
  category: TicketListItem["category"];
  createdAt?: string;
  description: string;
  images?: Array<{ image?: number | string | { id?: number | string } }>;
  priority: TicketListItem["priority"];
  status: TicketListItem["status"];
  tenant?: { email?: string; id?: number | string; name?: string } | number | string | null;
  title: string;
  updatedAt?: string;
};

const resolveUserName = (value: TicketDoc["tenant"] | TicketDoc["assignedTo"]) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return value.name ?? value.email ?? undefined;
};

const toListItem = (ticket: TicketDoc): TicketListItem => {
  return {
    assignedToName: resolveUserName(ticket.assignedTo),
    category: ticket.category,
    createdAt: ticket.createdAt,
    description: ticket.description,
    id: ticket.id,
    imageCount: ticket.images?.length ?? 0,
    priority: ticket.priority,
    status: ticket.status,
    tenantName: resolveUserName(ticket.tenant),
    title: ticket.title,
    updatedAt: ticket.updatedAt,
  };
};

const getPageCopy = (role: UserRole) => {
  if (role === "manager") {
    return {
      description: "Review all maintenance requests and keep assignments moving.",
      title: "All Tickets",
    };
  }

  if (role === "technician") {
    return {
      description: "Track tasks currently assigned to you.",
      title: "Assigned Tasks",
    };
  }

  return {
    description: "Review your maintenance requests and their latest status.",
    title: "My Tickets",
  };
};

export default async function TicketsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !currentUser.role) {
    redirect("/login");
  }

  const role = currentUser.role;
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "tickets",
    depth: 1,
    limit: 100,
    overrideAccess: false,
    sort: "-updatedAt",
    user: currentUser,
  });

  const tickets = (result.docs as TicketDoc[]).map(toListItem);
  const copy = getPageCopy(role);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
        {role === "tenant" ? (
          <Button render={<Link href="/tickets/new" />}>
            New Request
          </Button>
        ) : null}
      </section>

      {tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          No tickets found for your role yet.
        </div>
      ) : (
        <>
          <div className="md:hidden">
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <TicketCard key={String(ticket.id)} ticket={ticket} />
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <TicketsDataTable role={role} tickets={tickets} />
          </div>
        </>
      )}
    </div>
  );
}
