import type { PayloadRequest } from "payload";
import { normalizeRelationId } from "@/src/lib/access";

type ActivityAction =
  | "created"
  | "assigned"
  | "status-changed"
  | "priority-changed"
  | "comment-added";

type RelationValue = null | number | string | { id?: number | string } | undefined;

type TicketLike = {
  id?: number | string;
  tenant?: RelationValue;
  assignedTo?: RelationValue;
};

type CreateActivityLogArgs = {
  action: ActivityAction;
  actor?: RelationValue;
  details?: Record<string, unknown>;
  message: string;
  req: PayloadRequest;
  ticket: TicketLike;
};

export const createActivityLog = async ({
  action,
  actor,
  details,
  message,
  req,
  ticket,
}: CreateActivityLogArgs): Promise<void> => {
  const ticketId = normalizeRelationId(ticket.id);
  const tenantId = normalizeRelationId(ticket.tenant);
  const assignedToId = normalizeRelationId(ticket.assignedTo);
  const actorId = normalizeRelationId(actor);

  if (!ticketId || !tenantId) {
    return;
  }

  await req.payload.create({
    collection: "activity-logs",
    data: {
      action,
      actor: actorId,
      assignedTo: assignedToId,
      details,
      message,
      tenant: tenantId,
      ticket: ticketId,
    },
    overrideAccess: true,
    req,
  });
};
