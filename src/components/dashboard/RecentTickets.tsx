import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TicketStatus = "assigned" | "done" | "in-progress" | "open";

type RecentTicket = {
  id: number | string;
  status: TicketStatus;
  tenantName: string;
  title: string;
  updatedAt?: string;
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  assigned: "Assigned",
  done: "Done",
  "in-progress": "In Progress",
  open: "Open",
};

const STATUS_CLASSNAMES: Record<TicketStatus, string> = {
  assigned: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  done: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  "in-progress": "bg-amber-100 text-amber-900 hover:bg-amber-100",
  open: "bg-slate-100 text-slate-800 hover:bg-slate-100",
};

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const RecentTickets = ({ tickets }: { tickets: RecentTicket[] }) => {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm lg:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Recent Tickets</h2>
        <Link className="text-sm font-medium text-muted-foreground hover:text-foreground" href="/tickets">
          View all
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No tickets found for your role yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={String(ticket.id)}>
                <TableCell className="font-medium">
                  <Link className="hover:underline" href={`/tickets/${ticket.id}`}>
                    {ticket.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_CLASSNAMES[ticket.status]} variant="secondary">
                    {STATUS_LABELS[ticket.status]}
                  </Badge>
                </TableCell>
                <TableCell>{ticket.tenantName}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDate(ticket.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
};

export type { RecentTicket };
