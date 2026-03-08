import "server-only";

import { cookies } from "next/headers";

import { getPayloadClient } from "./payload";

export type CurrentUser = {
  id: number | string;
  email?: string;
  name?: string;
  role?: "tenant" | "manager" | "technician";
};

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("payload-token")?.value;

  if (!token) {
    return null;
  }

  const payload = await getPayloadClient();

  const authResult = await payload.auth({
    headers: new Headers({
      cookie: `payload-token=${token}`,
    }),
  });

  if (!authResult.user) {
    return null;
  }

  const user = authResult.user as CurrentUser;
  return user;
};
