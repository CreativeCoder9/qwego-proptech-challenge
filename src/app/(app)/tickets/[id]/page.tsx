import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ActivityLog } from "@/src/components/tickets/ActivityLog";
import { TicketActionsPanel } from "@/src/components/tickets/TicketActionsPanel";
import { TicketDetail } from "@/src/components/tickets/TicketDetail";
import { type TicketCategory, type TicketPriority, type TicketStatus, type UserRole } from "@/src/components/tickets/types";
import { getCurrentUser } from "@/src/lib/auth";
import { normalizeRelationId } from "@/src/lib/access";
import { getPayloadClient } from "@/src/lib/payload";

type RelationUser =
  | {
    email?: string;
    id?: number | string;
    name?: string;
    role?: UserRole;
  }
  | number
  | string
  | null
  | undefined;

type RelationMedia =
  | {
    filename?: string;
    id?: number | string;
    url?: string;
  }
  | number
  | string
  | null
  | undefined;

type TicketDetailDoc = {
  assignedTo?: RelationUser;
  building?: string;
  category: TicketCategory;
  createdAt?: string;
  description: string;
  id: number | string;
  images?: Array<{ id?: number | string; image?: RelationMedia }>;
  priority: TicketPriority;
  resolvedAt?: string;
  status: TicketStatus;
  tenant?: RelationUser;
  title: string;
  unit?: string;
  updatedAt?: string;
};

type ActivityLogDoc = {
  action: "assigned" | "comment-added" | "created" | "priority-changed" | "status-changed";
  actor?: RelationUser;
  createdAt?: string;
  id: number | string;
  message: string;
};

type TechnicianOption = {
  email?: string;
  id: number | string;
  name?: string;
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
      depth: 2,
      id,
      overrideAccess: false,
      user: currentUser,
    })) as TicketDetailDoc;

    const activityLogsResult = await payload.find({
      collection: "activity-logs",
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: "-createdAt",
      user: currentUser,
      where: {
        ticket: {
          equals: ticket.id,
        },
      },
    });

    const technicians: TechnicianOption[] =
      currentUser.role === "manager" || currentUser.role === "admin"
        ? (((
          await payload.find({
            collection: "users",
            depth: 0,
            limit: 100,
            overrideAccess: false,
            sort: "name",
            user: currentUser,
            where: {
              role: {
                equals: "technician",
              },
            },
          })
        ).docs as Array<{ email?: string; id: number | string; name?: string }>) ?? [])
        : [];

    return (
      <div className="space-y-6">
        <section className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ticket Details</h1>
            <p className="text-sm text-muted-foreground">Ticket #{String(ticket.id)}</p>
          </div>
          <Button render={<Link href="/tickets" />} size="sm" variant="outline" nativeButton={false}>
            Back to Tickets
          </Button>
        </section>

        <TicketDetail ticket={ticket} />

        <TicketActionsPanel
          assignedToId={normalizeRelationId(ticket.assignedTo)}
          currentUserId={currentUser.id}
          role={currentUser.role}
          status={ticket.status}
          ticketId={ticket.id}
          technicians={technicians}
          priority={ticket.priority}
        />

        <ActivityLog logs={activityLogsResult.docs as ActivityLogDoc[]} />
      </div>
    );
  } catch {
    notFound();
  }
}
