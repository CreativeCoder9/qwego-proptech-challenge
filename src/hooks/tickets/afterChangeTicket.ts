import type { CollectionAfterChangeHook } from "payload";
import { normalizeRelationId, type RequestUser } from "@/src/lib/access";
import { createActivityLog } from "./createActivityLog";

type TicketStatus = "open" | "assigned" | "in-progress" | "done";
type TicketPriority = "low" | "medium" | "high" | "critical";
type RelationValue = null | number | string | { id?: number | string } | undefined;
type UserContact = { email?: string; name?: string };

type TicketDoc = {
  id: number | string;
  assignedTo?: RelationValue;
  priority?: TicketPriority;
  status?: TicketStatus;
  tenant?: RelationValue;
  title?: string;
};

type NotificationType = "ticket-created" | "ticket-assigned" | "status-update";

const getUserContactById = async ({
  req,
  userId,
}: {
  req: Parameters<CollectionAfterChangeHook>[0]["req"];
  userId: number | string | undefined;
}): Promise<UserContact> => {
  if (!userId) {
    return {};
  }

  const user = await req.payload.findByID({
    id: userId,
    collection: "users",
    depth: 0,
    overrideAccess: true,
    req,
  });

  const resolvedUser = user as { email?: string; name?: string } | null | undefined;

  return {
    email: resolvedUser?.email || undefined,
    name: resolvedUser?.name || undefined,
  };
};

const findAllManagers = async (
  req: Parameters<CollectionAfterChangeHook>[0]["req"],
): Promise<Array<{ email?: string; id: number | string; name?: string }>> => {
  const managers: Array<{ email?: string; id: number | string; name?: string }> = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const response = await req.payload.find({
      collection: "users",
      depth: 0,
      limit,
      overrideAccess: true,
      page,
      req,
      where: {
        role: {
          equals: "manager",
        },
      },
    });

    managers.push(
      ...response.docs.map((doc) => ({
        email: (doc as { email?: string }).email,
        id: doc.id,
        name: (doc as { name?: string }).name,
      })),
    );

    if (!response.hasNextPage) {
      break;
    }

    page += 1;
  }

  return managers;
};

const sendNotificationEmail = async ({
  message,
  recipientEmail,
  recipientName,
  req,
  ticketId,
}: {
  message: string;
  recipientEmail: string;
  recipientName?: string;
  req: Parameters<CollectionAfterChangeHook>[0]["req"];
  ticketId: number | string;
}): Promise<void> => {
  const appBaseURL = process.env.APP_BASE_URL?.replace(/\/$/, "");
  const ticketPath = `/tickets/${ticketId}`;
  const ticketURL = appBaseURL ? `${appBaseURL}${ticketPath}` : ticketPath;

  await req.payload.sendEmail({
    subject: `Property Manager Update: ${message}`,
    text: `${recipientName ? `Hi ${recipientName},` : "Hello,"}

${message}

Open ticket: ${ticketURL}`,
    to: recipientEmail,
  });
};

const createNotification = async ({
  message,
  recipient,
  recipientEmail,
  recipientName,
  req,
  ticketId,
  type,
}: {
  message: string;
  recipient: RelationValue;
  recipientEmail?: string;
  recipientName?: string;
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

  let resolvedEmail = recipientEmail;
  let resolvedName = recipientName;

  if ((!resolvedEmail || !resolvedName) && recipientId) {
    const recipientContact = await getUserContactById({ req, userId: recipientId });
    resolvedEmail = resolvedEmail || recipientContact.email;
    resolvedName = resolvedName || recipientContact.name;
  }

  if (!resolvedEmail) {
    return;
  }

  try {
    await sendNotificationEmail({
      message,
      recipientEmail: resolvedEmail,
      recipientName: resolvedName,
      req,
      ticketId,
    });
  } catch (error) {
    console.error("Failed to send notification email", {
      error,
      recipientEmail: resolvedEmail,
      ticketId,
      type,
    });
  }
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

    const managers = await findAllManagers(req);

    await Promise.all(
      managers.map(async (manager) =>
        createNotification({
          message: `New maintenance ticket: "${currentTicket.title ?? "Untitled"}".`,
          recipient: manager.id,
          recipientEmail: manager.email,
          recipientName: manager.name,
          req,
          ticketId: currentTicket.id,
          type: "ticket-created",
        }),
      ),
    );

    return doc;
  }

  if (operation !== "update") {
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
    const assigneeContact = await getUserContactById({ req, userId: nextAssignedTo });
    const assigneeName = assigneeContact.name;
    const assigneeLabel = assigneeName ?? (nextAssignedTo ? `technician ${nextAssignedTo}` : "none");

    await createActivityLog({
      action: "assigned",
      actor: actor?.id,
      details: {
        from: previousAssignedTo ?? null,
        to: nextAssignedTo ?? null,
        assigneeName: assigneeName ?? null,
      },
      message: `Ticket assigned to ${assigneeLabel}.`,
      req,
      ticket: currentTicket,
    });

    if (nextAssignedTo) {
      await createNotification({
        message: `You were assigned ticket "${currentTicket.title ?? currentTicket.id}".`,
        recipient: nextAssignedTo,
        recipientEmail: assigneeContact.email,
        recipientName: assigneeContact.name,
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
