import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
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
  email: await nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS || "no-reply@qwego.local",
    defaultFromName: process.env.SMTP_FROM_NAME || "Qwego Property Manager",
    transportOptions:
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            auth: {
              pass: process.env.SMTP_PASS,
              user: process.env.SMTP_USER,
            },
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
          }
        : undefined,
  }),
  collections: [Users, Media, Tickets, ActivityLogs, Notifications],
  admin: {
    user: Users.slug,
  },
});
