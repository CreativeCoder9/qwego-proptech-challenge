import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { buildConfig } from "payload";

import { ActivityLogs } from "./src/collections/ActivityLogs";
import { Media } from "./src/collections/Media";
import { Notifications } from "./src/collections/Notifications";
import { Tickets } from "./src/collections/Tickets";
import { Users } from "./src/collections/Users";

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "dev-secret-change-me",
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || "file:./payload.db",
    },
  }),
  collections: [Users, Media, Tickets, ActivityLogs, Notifications],
  admin: {
    user: Users.slug,
  },
});
