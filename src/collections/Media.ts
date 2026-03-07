import type { CollectionConfig } from "payload";

type UserRole = "tenant" | "manager" | "technician";

type RequestUser = {
  role?: UserRole;
};

const isAuthenticated = (user?: RequestUser | null) => Boolean(user);
const isManager = (user?: RequestUser | null) => user?.role === "manager";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: ({ req }) => isAuthenticated(req.user as RequestUser | null | undefined),
    read: ({ req }) => isAuthenticated(req.user as RequestUser | null | undefined),
    update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
    delete: ({ req }) => isManager(req.user as RequestUser | null | undefined),
  },
  upload: {
    staticDir: "public/media",
    imageSizes: [
      {
        name: "thumbnail",
        width: 320,
        height: 320,
        fit: "cover",
      },
      {
        name: "medium",
        width: 1024,
        height: 768,
        fit: "inside",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  fields: [],
};
