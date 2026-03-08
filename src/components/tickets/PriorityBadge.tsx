import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, type TicketPriority } from "@/src/components/tickets/types";

const PRIORITY_CLASSNAMES: Record<TicketPriority, string> = {
  critical: "bg-red-100 text-red-800 hover:bg-red-100",
  high: "bg-orange-100 text-orange-900 hover:bg-orange-100",
  low: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  medium: "bg-yellow-100 text-yellow-900 hover:bg-yellow-100",
};

export const PriorityBadge = ({ priority }: { priority: TicketPriority }) => {
  return (
    <Badge className={PRIORITY_CLASSNAMES[priority]} variant="secondary">
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
};
