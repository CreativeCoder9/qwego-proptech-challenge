import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type TicketStatus } from "@/src/components/tickets/types";

const STATUS_CLASSNAMES: Record<TicketStatus, string> = {
  assigned: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  done: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  "in-progress": "bg-amber-100 text-amber-900 hover:bg-amber-100",
  open: "bg-slate-100 text-slate-800 hover:bg-slate-100",
};

export const StatusBadge = ({ status }: { status: TicketStatus }) => {
  return (
    <Badge className={STATUS_CLASSNAMES[status]} variant="secondary">
      {STATUS_LABELS[status]}
    </Badge>
  );
};
