import type { CollectionAfterChangeHook } from "payload";
import { normalizeRelationId, type RequestUser } from "@/src/lib/access";
import { createActivityLog } from "./createActivityLog";

type TicketStatus = "open" | "assigned" | "in-progress" | "done";
type TicketPriority = "low" | "medium" | "high" | "critical";
type RelationValue = null | number | string | { id?: number | string } | undefined;

type TicketDoc = {
  id: number | string;
  assignedTo?: RelationValue;
  priority?: TicketPriority;
  status?: TicketStatus;
  tenant?: RelationValue;
  title?: string;
};

type NotificationType = "ticket-created" | "ticket-assigned" | "status-update";

const createNotification = async ({
  message,
  recipient,
  req,
  ticketId,
  type,
}: {
  message: string;
  recipient: RelationValue;
  req: Parameters<CollectionAfterChangeHook>[0]["req"];
  ticketId: number | string;
  type: NotificationType;
}): Promise<void> => {
  const recipientId = normalizeRelationId(recipient);

  if (!recipientId) {
    return;
  }

  await req.payload.create({
    collection: "notifications",
    data: {
      message,
      read: false,
      recipient: recipientId,
      ticket: ticketId,
      type,
    },
    overrideAccess: true,
    req,
  });
};

export const afterChangeTicket: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const currentTicket = doc as TicketDoc;
  const previousTicket = previousDoc as TicketDoc | undefined;
  const actor = req.user as RequestUser | null | undefined;

  if (operation === "create") {
    await createActivityLog({
      action: "created",
      actor: actor?.id,
      message: `Ticket "${currentTicket.title ?? currentTicket.id}" was created.`,
      req,
      ticket: currentTicket,
    });

    const managers = await req.payload.find({
      collection: "users",
      depth: 0,
      limit: 100,
      overrideAccess: true,
      req,
      where: {
        role: {
          equals: "manager",
        },
      },
    });

    await Promise.all(
      managers.docs.map(async (manager) =>
        createNotification({
          message: `New maintenance ticket: "${currentTicket.title ?? "Untitled"}".`,
          recipient: manager.id,
          req,
          ticketId: currentTicket.id,
          type: "ticket-created",
        }),
      ),
    );

    return doc;
  }

  const previousStatus = previousTicket?.status;
  const nextStatus = currentTicket.status;
  const previousPriority = previousTicket?.priority;
  const nextPriority = currentTicket.priority;
  const previousAssignedTo = normalizeRelationId(previousTicket?.assignedTo);
  const nextAssignedTo = normalizeRelationId(currentTicket.assignedTo);
  const tenantId = normalizeRelationId(currentTicket.tenant);
  let assignedTechnicianNotified = false;

  if (previousAssignedTo !== nextAssignedTo) {
    await createActivityLog({
      action: "assigned",
      actor: actor?.id,
      details: {
        from: previousAssignedTo ?? null,
        to: nextAssignedTo ?? null,
      },
      message: `Ticket assigned to technician ${nextAssignedTo ?? "none"}.`,
      req,
      ticket: currentTicket,
    });

    if (nextAssignedTo) {
      await createNotification({
        message: `You were assigned ticket "${currentTicket.title ?? currentTicket.id}".`,
        recipient: nextAssignedTo,
        req,
        ticketId: currentTicket.id,
        type: "ticket-assigned",
      });
      assignedTechnicianNotified = true;
    }
  }

  if (previousStatus !== nextStatus && previousStatus && nextStatus) {
    await createActivityLog({
      action: "status-changed",
      actor: actor?.id,
      details: {
        from: previousStatus,
        to: nextStatus,
      },
      message: `Status changed from ${previousStatus} to ${nextStatus}.`,
      req,
      ticket: currentTicket,
    });

    if (nextStatus === "assigned" && nextAssignedTo && !assignedTechnicianNotified) {
      await createNotification({
        message: `Ticket "${currentTicket.title ?? currentTicket.id}" is now assigned to you.`,
        recipient: nextAssignedTo,
        req,
        ticketId: currentTicket.id,
        type: "ticket-assigned",
      });
      assignedTechnicianNotified = true;
    }

    if (nextStatus === "done" && tenantId) {
      await createNotification({
        message: `Your ticket "${currentTicket.title ?? currentTicket.id}" is marked done.`,
        recipient: tenantId,
        req,
        ticketId: currentTicket.id,
        type: "status-update",
      });
    }
  }

  if (previousPriority !== nextPriority && previousPriority && nextPriority) {
    await createActivityLog({
      action: "priority-changed",
      actor: actor?.id,
      details: {
        from: previousPriority,
        to: nextPriority,
      },
      message: `Priority changed from ${previousPriority} to ${nextPriority}.`,
      req,
      ticket: currentTicket,
    });
  }

  return doc;
};
