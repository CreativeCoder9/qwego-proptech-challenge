import type { Access, CollectionConfig } from "payload";
import { isManager, type RequestUser } from "@/src/lib/access";

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
      label: "Apartment / Unit No.",
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
