import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/src/components/tickets/PriorityBadge";
import { StatusBadge } from "@/src/components/tickets/StatusBadge";
import { CATEGORY_LABELS, formatDate, type TicketCategory, type TicketPriority, type TicketStatus } from "@/src/components/tickets/types";
import { getCurrentUser } from "@/src/lib/auth";
import { getPayloadClient } from "@/src/lib/payload";

type TicketDetailDoc = {
  id: number | string;
  category: TicketCategory;
  createdAt?: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  updatedAt?: string;
};

type TicketDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !currentUser.role) {
    redirect("/login");
  }

  const payload = await getPayloadClient();
  const { id } = await params;

  try {
    const ticket = (await payload.findByID({
      collection: "tickets",
      depth: 0,
      id,
      overrideAccess: false,
      user: currentUser,
    })) as TicketDetailDoc;

    return (
      <div className="space-y-6">
        <section className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ticket Details</h1>
            <p className="text-sm text-muted-foreground">Ticket #{String(ticket.id)}</p>
          </div>
          <Button render={<Link href="/tickets" />} size="sm" variant="outline">
            Back to Tickets
          </Button>
        </section>

        <Card>
          <CardHeader className="gap-3">
            <CardTitle>{ticket.title}</CardTitle>
            <CardDescription>{ticket.description}</CardDescription>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground">
                {CATEGORY_LABELS[ticket.category]}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Created:</span> {formatDate(ticket.createdAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Updated:</span> {formatDate(ticket.updatedAt)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  } catch {
    notFound();
  }
}
