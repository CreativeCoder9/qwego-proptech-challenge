import type { Access, CollectionConfig, Where } from "payload";

type UserRole = "tenant" | "manager" | "technician";

type RequestUser = {
  id: number | string;
  role?: UserRole;
};

const isManager = (user?: RequestUser | null) => user?.role === "manager";
const isTenant = (user?: RequestUser | null) => user?.role === "tenant";
const isTechnician = (user?: RequestUser | null) => user?.role === "technician";

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
        create: ({ req }) => isManager(req.user as RequestUser | null | undefined),
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
