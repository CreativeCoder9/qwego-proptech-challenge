import configPromise from "@/payload.config";
import { getPayloadHMR } from "@payloadcms/next/utilities";

let payloadPromise: ReturnType<typeof getPayloadHMR> | null = null;

export const getPayloadClient = async () => {
  if (!payloadPromise) {
    payloadPromise = getPayloadHMR({ config: configPromise });
  }

  return payloadPromise;
};

