import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/src/components/tickets/PriorityBadge";
import { StatusBadge } from "@/src/components/tickets/StatusBadge";
import { CATEGORY_LABELS, formatDate, type TicketListItem } from "@/src/components/tickets/types";

export const TicketCard = ({ ticket }: { ticket: TicketListItem }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 text-base">{ticket.title}</CardTitle>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={ticket.priority} />
          <span className="rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground">
            {CATEGORY_LABELS[ticket.category]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="line-clamp-3 text-muted-foreground">{ticket.description}</p>
        <p className="text-xs text-muted-foreground">
          Updated: <span className="font-medium text-foreground">{formatDate(ticket.updatedAt)}</span>
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {ticket.imageCount > 0 ? `${ticket.imageCount} image${ticket.imageCount === 1 ? "" : "s"}` : "No images"}
        </p>
        <Button render={<Link href={`/tickets/${ticket.id}`} />} size="sm" variant="outline">
          View
        </Button>
      </CardFooter>
    </Card>
  );
};
