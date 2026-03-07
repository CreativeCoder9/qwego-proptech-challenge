import type { Access, CollectionConfig, Where } from "payload";
import { isManager, isTechnician, isTenant, type RequestUser } from "@/src/lib/access";

const canReadActivityLogs: Access = ({ req }) => {
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
      name: "tenant",
      type: "relationship",
      relationTo: "users",
      required: true,
      filterOptions: {
        role: {
          equals: "tenant",
        },
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
