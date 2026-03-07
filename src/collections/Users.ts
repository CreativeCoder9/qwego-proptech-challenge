import type { Access, CollectionConfig } from "payload";

type UserRole = "tenant" | "manager" | "technician";

type RequestUser = {
  id: number | string;
  role?: UserRole;
};

const isManager = (user?: RequestUser | null) => user?.role === "manager";

const canReadUsers: Access = ({ req }) => {
  const user = req.user as RequestUser | null | undefined;

  if (!user) {
    return false;
  }

  if (isManager(user)) {
    return true;
  }

  return {
    id: {
      equals: user.id,
    },
  };
};

const canUpdateUsers: Access = ({ req }) => {
  const user = req.user as RequestUser | null | undefined;

  if (!user) {
    return false;
  }

  if (isManager(user)) {
    return true;
  }

  return {
    id: {
      equals: user.id,
    },
  };
};

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  access: {
    create: () => true,
    read: canReadUsers,
    update: canUpdateUsers,
    delete: ({ req }) => isManager(req.user as RequestUser | null | undefined),
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "tenant",
      options: [
        { label: "Tenant", value: "tenant" },
        { label: "Manager", value: "manager" },
        { label: "Technician", value: "technician" },
      ],
      access: {
        create: ({ req }) => isManager(req.user as RequestUser | null | undefined),
        update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
      },
    },
    {
      name: "unit",
      type: "text",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
    },
  ],
};
