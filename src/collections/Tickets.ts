import type { Access, CollectionConfig, Where } from "payload";
import { ValidationError } from "payload";
import {
  isManager,
  isTechnician,
  isTenant,
  normalizeRelationId,
  type RequestUser,
} from "@/src/lib/access";

type TicketStatus = "open" | "assigned" | "in-progress" | "done";

const nextStatus: Record<TicketStatus, TicketStatus[]> = {
  open: ["assigned"],
  assigned: ["in-progress"],
  "in-progress": ["done"],
  done: [],
};

const canReadTickets: Access = ({ req }) => {
  const user = req.user as RequestUser | null | undefined;

  if (!user) {
    return false;
  }

  if (isManager(user)) {
    return true;
  }

  if (isTenant(user)) {
    const where: Where = {
      tenant: {
        equals: user.id,
      },
    };
    return where;
  }

  if (isTechnician(user)) {
    const where: Where = {
      assignedTo: {
        equals: user.id,
      },
    };
    return where;
  }

  return false;
};

const canUpdateTickets: Access = ({ req }) => {
  const user = req.user as RequestUser | null | undefined;

  if (!user) {
    return false;
  }

  if (isManager(user)) {
    return true;
  }

  if (isTechnician(user)) {
    const where: Where = {
      assignedTo: {
        equals: user.id,
      },
    };
    return where;
  }

  return false;
};

export const Tickets: CollectionConfig = {
  slug: "tickets",
  access: {
    create: ({ req }) => isTenant(req.user as RequestUser | null | undefined),
    read: canReadTickets,
    update: canUpdateTickets,
    delete: () => false,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        const user = req.user as RequestUser | null | undefined;

        if (!data || !user) {
          return data;
        }

        if (operation === "create" && isTenant(user)) {
          data.tenant = user.id;
          data.status = "open";
          data.assignedTo = undefined;
        }

        return data;
      },
    ],
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        const user = req.user as RequestUser | null | undefined;

        if (!data || !user) {
          return data;
        }

        if (operation === "update") {
          const previousStatus = originalDoc?.status as TicketStatus | undefined;
          const incomingStatus = (data.status ?? previousStatus) as TicketStatus | undefined;

          if (isTechnician(user)) {
            const assignedTo = normalizeRelationId(originalDoc?.assignedTo);

            if (!assignedTo || String(assignedTo) !== String(user.id)) {
              throw new ValidationError({
                errors: [
                  {
                    message: "Only the assigned technician can update this ticket.",
                    path: "assignedTo",
                  },
                ],
              });
            }

            const forbiddenTechnicianFields = [
              "assignedTo",
              "priority",
              "tenant",
              "title",
              "description",
              "category",
              "images",
              "unit",
              "building",
            ] as const;

            for (const field of forbiddenTechnicianFields) {
              if (field in data) {
                throw new ValidationError({
                  errors: [
                    {
                      message: `Technicians cannot update ${field}.`,
                      path: field,
                    },
                  ],
                });
              }
            }
          }

          if (previousStatus && incomingStatus && previousStatus !== incomingStatus) {
            const allowed = nextStatus[previousStatus];
            const transitionAllowed = allowed.includes(incomingStatus);

            if (!transitionAllowed) {
              throw new ValidationError({
                errors: [
                  {
                    message: `Invalid status transition from ${previousStatus} to ${incomingStatus}.`,
                    path: "status",
                  },
                ],
              });
            }
          }

          if (incomingStatus === "done") {
            data.resolvedAt = new Date().toISOString();
          }
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "images",
      type: "array",
      maxRows: 5,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "open",
      options: [
        { label: "Open", value: "open" },
        { label: "Assigned", value: "assigned" },
        { label: "In Progress", value: "in-progress" },
        { label: "Done", value: "done" },
      ],
      access: {
        update: ({ req }) => {
          const user = req.user as RequestUser | null | undefined;
          return isManager(user) || isTechnician(user);
        },
      },
    },
    {
      name: "priority",
      type: "select",
      required: true,
      defaultValue: "medium",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
        { label: "Critical", value: "critical" },
      ],
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "other",
      options: [
        { label: "Plumbing", value: "plumbing" },
        { label: "Electrical", value: "electrical" },
        { label: "HVAC", value: "hvac" },
        { label: "Structural", value: "structural" },
        { label: "Other", value: "other" },
      ],
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "tenant",
      type: "relationship",
      relationTo: "users",
      required: true,
      filterOptions: {
        role: {
          equals: "tenant",
        },
      },
      defaultValue: ({ req }) => (req.user as RequestUser | null | undefined)?.id,
      access: {
        create: ({ req }) => {
          const user = req.user as RequestUser | null | undefined;
          return isTenant(user) || isManager(user);
        },
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "assignedTo",
      type: "relationship",
      relationTo: "users",
      filterOptions: {
        role: {
          equals: "technician",
        },
      },
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "unit",
      type: "text",
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "building",
      type: "text",
      access: {
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "resolvedAt",
      type: "date",
      admin: {
        readOnly: true,
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
  ],
};
