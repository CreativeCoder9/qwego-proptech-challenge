import type { Access, CollectionConfig, Where } from "payload";
import { ValidationError } from "payload";
import { isAdmin, isManager, type RequestUser } from "@/src/lib/access";

const MANAGEABLE_ROLES = ["tenant", "technician"] as const;

const isManageableRole = (value: unknown): value is (typeof MANAGEABLE_ROLES)[number] =>
  typeof value === "string" && MANAGEABLE_ROLES.includes(value as (typeof MANAGEABLE_ROLES)[number]);

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

  if (isAdmin(user)) {
    return true;
  }

  if (user.role === "manager") {
    const where: Where = {
      or: [
        {
          id: {
            equals: user.id,
          },
        },
        {
          role: {
            in: [...MANAGEABLE_ROLES],
          },
        },
      ],
    };

    return where;
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

  if (isAdmin(user) || user?.role === "manager") {
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
    delete: ({ req }) => {
      const user = req.user as RequestUser | null | undefined;

      if (isAdmin(user)) {
        return true;
      }

      if (user?.role === "manager") {
        return {
          role: {
            in: [...MANAGEABLE_ROLES],
          },
        };
      }

      return false;
    },
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
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        const user = req.user as RequestUser | null | undefined;

        if (!data || !user || isAdmin(user)) {
          return data;
        }

        if (user.role !== "manager") {
          return data;
        }

        if (operation === "create") {
          const requestedRole = (data.role ?? "tenant") as unknown;

          if (!isManageableRole(requestedRole)) {
            throw new ValidationError({
              errors: [
                {
                  message: "Managers can only create tenant or technician users.",
                  path: "role",
                },
              ],
            });
          }
        }

        if (operation === "update") {
          const originalRole = (originalDoc as { role?: unknown } | undefined)?.role;
          const originalId = (originalDoc as { id?: number | string } | undefined)?.id;

          if (!isManageableRole(originalRole) && String(originalId) !== String(user.id)) {
            throw new ValidationError({
              errors: [
                {
                  message: "Managers can only manage tenant and technician accounts.",
                  path: "role",
                },
              ],
            });
          }

          if ("role" in data) {
            const requestedRole = data.role as unknown;
            if (typeof requestedRole !== "undefined" && !isManageableRole(requestedRole)) {
              throw new ValidationError({
                errors: [
                  {
                    message: "Managers can only assign tenant or technician roles.",
                    path: "role",
                  },
                ],
              });
            }
          }
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
        update: ({ req }) => {
          const user = req.user as RequestUser | null | undefined;
          return isAdmin(user) || user?.role === "manager";
        },
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
