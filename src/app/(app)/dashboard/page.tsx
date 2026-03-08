import { redirect } from "next/navigation";
import type { Where } from "payload";

import { getCurrentUser } from "@/src/lib/auth";
import { getPayloadClient } from "@/src/lib/payload";
import { RecentTickets, type RecentTicket } from "@/src/components/dashboard/RecentTickets";
import { StatsCards, type StatsCounts } from "@/src/components/dashboard/StatsCards";

type TicketStatus = "open" | "assigned" | "in-progress" | "done";
type UserRole = "tenant" | "manager" | "technician";

type TicketDoc = {
  id: number | string;
  status: TicketStatus;
  title: string;
  updatedAt?: string;
  tenant?: { id?: number | string; name?: string } | number | string;
};

const statusToStatKey: Record<TicketStatus, keyof StatsCounts> = {
  assigned: "assigned",
  done: "done",
  "in-progress": "inProgress",
  open: "open",
};

const getRoleWhere = (role: UserRole, userId: number | string): Where | undefined => {
  if (role === "manager") {
    return undefined;
  }

  if (role === "tenant") {
    return {
      tenant: {
        equals: userId,
      },
    };
  }

  return {
    assignedTo: {
      equals: userId,
    },
  };
};

const buildStatusWhere = (baseWhere: Where | undefined, status: TicketStatus): Where => {
  const statusWhere: Where = {
    status: {
      equals: status,
    },
  };

  if (!baseWhere) {
    return statusWhere;
  }

  return {
    and: [baseWhere, statusWhere],
  };
};

const toRecentTicket = (ticket: TicketDoc): RecentTicket => {
  const tenantName =
    typeof ticket.tenant === "object" && ticket.tenant !== null
      ? ticket.tenant.name ?? "Tenant"
      : "Tenant";

  return {
    id: ticket.id,
    status: ticket.status,
    tenantName,
    title: ticket.title,
    updatedAt: ticket.updatedAt,
  };
};

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    redirect("/login");
  }

  const role = (currentUser.role ?? "tenant") as UserRole;
  const payload = await getPayloadClient();
  const roleWhere = getRoleWhere(role, currentUser.id);

  const statuses: TicketStatus[] = ["open", "assigned", "in-progress", "done"];

  const [statusResults, recentResult] = await Promise.all([
    Promise.all(
      statuses.map((status) =>
        payload.find({
          collection: "tickets",
          depth: 0,
          limit: 1,
          overrideAccess: true,
          where: buildStatusWhere(roleWhere, status),
        }),
      ),
    ),
    payload.find({
      collection: "tickets",
      depth: 1,
      limit: 5,
      overrideAccess: true,
      sort: "-updatedAt",
      where: roleWhere,
    }),
  ]);

  const counts: StatsCounts = {
    assigned: 0,
    done: 0,
    inProgress: 0,
    open: 0,
  };

  statusResults.forEach((result, index) => {
    const status = statuses[index];
    counts[statusToStatKey[status]] = result.totalDocs;
  });

  const recentTickets = (recentResult.docs as TicketDoc[]).map(toRecentTicket);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Track ticket progress and team workload in one place.</p>
      </section>

      <StatsCards counts={counts} />
      <RecentTickets tickets={recentTickets} />
    </div>
  );
}
