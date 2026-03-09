import type { Access, CollectionConfig } from "payload";
import { isAdmin, isManager, type RequestUser } from "@/src/lib/access";

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

const canAccessAdminPortal = ({ req }: { req: { user?: RequestUser | null } }) => {
  const user = req.user as RequestUser | null | undefined;
  return isAdmin(user);
};

const canCreateRole = async ({ req }: { req: Parameters<Access>[0]["req"] }) => {
  const user = req.user as RequestUser | null | undefined;

  if (isAdmin(user)) {
    return true;
  }

  const existingUsers = await req.payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
  });

  return existingUsers.totalDocs === 0;
};

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  access: {
    admin: canAccessAdminPortal,
    create: () => true,
    read: canReadUsers,
    update: canUpdateUsers,
    delete: ({ req }) => isAdmin(req.user as RequestUser | null | undefined),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!data || operation !== "create") {
          return data;
        }

        const existingUsers = await req.payload.find({
          collection: "users",
          depth: 0,
          limit: 1,
          overrideAccess: true,
          req,
        });

        if (existingUsers.totalDocs === 0) {
          data.role = "admin";
        }

        return data;
      },
    ],
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
        { label: "Admin", value: "admin" },
        { label: "Tenant", value: "tenant" },
        { label: "Manager", value: "manager" },
        { label: "Technician", value: "technician" },
      ],
      access: {
        create: canCreateRole,
        update: ({ req }) => isAdmin(req.user as RequestUser | null | undefined),
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
