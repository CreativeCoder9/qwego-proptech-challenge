import type { Access, CollectionConfig, Where } from "payload";

type UserRole = "tenant" | "manager" | "technician";

type RequestUser = {
  id: number | string;
  role?: UserRole;
};

const isManager = (user?: RequestUser | null) => user?.role === "manager";
const isTenant = (user?: RequestUser | null) => user?.role === "tenant";
const isTechnician = (user?: RequestUser | null) => user?.role === "technician";

const canReadActivityLogs: Access = ({ req }) => {
  const user = req.user as RequestUser | null | undefined;

  if (!user) {
    return false;
  }

  if (isManager(user)) {
    return true;
  }

  if (isTenant(user)) {
    const where = {
      "ticket.tenant": {
        equals: user.id,
      },
    } as Where;
    return where;
  }

  if (isTechnician(user)) {
    const where = {
      "ticket.assignedTo": {
        equals: user.id,
      },
    } as Where;
    return where;
  }

  return false;
};

export const ActivityLogs: CollectionConfig = {
  slug: "activity-logs",
  access: {
    create: () => false,
    read: canReadActivityLogs,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "ticket",
      type: "relationship",
      relationTo: "tickets",
      required: true,
      index: true,
    },
    {
      name: "actor",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "action",
      type: "select",
      required: true,
      options: [
        { label: "Created", value: "created" },
        { label: "Assigned", value: "assigned" },
        { label: "Status Changed", value: "status-changed" },
        { label: "Priority Changed", value: "priority-changed" },
        { label: "Comment Added", value: "comment-added" },
      ],
    },
    {
      name: "details",
      type: "json",
    },
    {
      name: "message",
      type: "text",
      required: true,
    },
  ],
};
