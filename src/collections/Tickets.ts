import type { Access, CollectionConfig, Where } from "payload";
import { ValidationError } from "payload";
import {
  isManager,
  isTechnician,
  isTenant,
  normalizeRelationId,
  type RequestUser,
} from "@/src/lib/access";
import { afterChangeTicket } from "@/src/hooks/tickets/afterChangeTicket";

type TicketStatus = "open" | "assigned" | "in-progress" | "done";

const nextStatus: Record<TicketStatus, TicketStatus[]> = {
  open: ["assigned", "done"],
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
          const previousAssignedTo = normalizeRelationId(originalDoc?.assignedTo);
          const incomingAssignedTo = normalizeRelationId(data.assignedTo ?? originalDoc?.assignedTo);

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

            // Technicians may progress status only on their own assigned ticket.
            // If an assignedTo value is present, it must not change.
            if ("assignedTo" in data) {
              const requestedAssignedTo = normalizeRelationId(data.assignedTo);

              if (!requestedAssignedTo || String(requestedAssignedTo) !== String(assignedTo)) {
                throw new ValidationError({
                  errors: [
                    {
                      message: "Technicians cannot reassign tickets.",
                      path: "assignedTo",
                    },
                  ],
                });
              }
            }

            const forbiddenTechnicianFields = [
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
                const incomingValue = (data as Record<string, unknown>)[field];
                const previousValue = (originalDoc as Record<string, unknown> | undefined)?.[field];

                // Payload may include unchanged fields on patch updates.
                // Block only when technician attempts to change a manager-owned field.
                if (typeof incomingValue === "undefined") {
                  continue;
                }

                const hasChanged =
                  field === "tenant"
                    ? String(normalizeRelationId(incomingValue as null | number | string | { id?: number | string } | undefined)) !==
                      String(
                        normalizeRelationId(
                          previousValue as null | number | string | { id?: number | string } | undefined,
                        ),
                      )
                    : JSON.stringify(incomingValue) !== JSON.stringify(previousValue);

                if (!hasChanged) {
                  continue;
                }

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

          // Keep status and assignment in sync with the defined workflow.
          if (!previousAssignedTo && incomingAssignedTo && incomingStatus === "open") {
            data.status = "assigned";
          }

          if (previousAssignedTo && !incomingAssignedTo && incomingStatus !== "open") {
            throw new ValidationError({
              errors: [
                {
                  message: "Cannot clear assigned technician unless status is open.",
                  path: "assignedTo",
                },
              ],
            });
          }

          if (incomingStatus === "assigned" && !incomingAssignedTo) {
            throw new ValidationError({
              errors: [
                {
                  message: "Assigned status requires an assigned technician.",
                  path: "assignedTo",
                },
              ],
            });
          }

          if (incomingStatus === "in-progress" && !incomingAssignedTo) {
            throw new ValidationError({
              errors: [
                {
                  message: `${incomingStatus} status requires an assigned technician.`,
                  path: "assignedTo",
                },
              ],
            });
          }

          if (incomingStatus === "done") {
            data.resolvedAt = new Date().toISOString();
          }
        }

        return data;
      },
    ],
    afterChange: [afterChangeTicket],
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
        update: ({ req }) => {
          const user = req.user as RequestUser | null | undefined;
          return isManager(user) || isTechnician(user);
        },
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
        update: ({ req }) => {
          const user = req.user as RequestUser | null | undefined;
          return isManager(user) || isTechnician(user);
        },
      },
    },
    {
      name: "unit",
      label: "Apartment / Unit No.",
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
