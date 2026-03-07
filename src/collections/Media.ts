import type { CollectionConfig } from "payload";
import { isAuthenticated, isManager, type RequestUser } from "@/src/lib/access";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: ({ req }) => isAuthenticated(req.user as RequestUser | null | undefined),
    read: ({ req }) => isAuthenticated(req.user as RequestUser | null | undefined),
    update: ({ req }) => isManager(req.user as RequestUser | null | undefined),
    delete: ({ req }) => isManager(req.user as RequestUser | null | undefined),
  },
  upload: {
    staticDir: "media",
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
