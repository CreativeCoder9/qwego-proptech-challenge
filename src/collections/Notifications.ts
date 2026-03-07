import type { Access, CollectionConfig } from "payload";

type RequestUser = {
  id: number | string;
};

const canReadNotifications: Access = ({ req }) => {
  const user = req.user as RequestUser | null | undefined;

  if (!user) {
    return false;
  }

  return {
    recipient: {
      equals: user.id,
    },
  };
};

export const Notifications: CollectionConfig = {
  slug: "notifications",
  access: {
    create: () => false,
    read: canReadNotifications,
    update: canReadNotifications,
    delete: () => false,
  },
  fields: [
    {
      name: "recipient",
      type: "relationship",
      relationTo: "users",
      required: true,
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: "ticket",
      type: "relationship",
      relationTo: "tickets",
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Ticket Created", value: "ticket-created" },
        { label: "Ticket Assigned", value: "ticket-assigned" },
        { label: "Status Update", value: "status-update" },
        { label: "Comment", value: "comment" },
      ],
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: "message",
      type: "text",
      required: true,
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: "read",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
