import "server-only";

import configPromise from "@/payload.config";
import { getPayload } from "payload";

let payloadPromise: ReturnType<typeof getPayload> | null = null;
let databaseReadyPromise: Promise<void> | null = null;

const ensureDatabaseReady = async (payload: Awaited<ReturnType<typeof getPayload>>) => {
  const db = payload.db as {
    connect?: (options?: { hotReload?: boolean }) => Promise<void>;
    initializing?: Promise<void>;
  };

  if (!databaseReadyPromise) {
    databaseReadyPromise = (async () => {
      if (db?.initializing) {
        await db.initializing;
      }

      if (typeof db?.connect === "function") {
        await db.connect({ hotReload: false });
      }

      if (db?.initializing) {
        await db.initializing;
      }
    })().catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }

  await databaseReadyPromise;
};

export const getPayloadClient = async () => {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config: configPromise }).catch((error) => {
      payloadPromise = null;
      throw error;
    });
  }

  const payload = await payloadPromise;
  await ensureDatabaseReady(payload);

  return payload;
};
