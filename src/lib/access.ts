export type UserRole = "tenant" | "manager" | "technician";

export type RequestUser = {
  id: number | string;
  role?: UserRole;
};

export const isAuthenticated = (user?: RequestUser | null) => Boolean(user);
export const isManager = (user?: RequestUser | null) => user?.role === "manager";
export const isTenant = (user?: RequestUser | null) => user?.role === "tenant";
export const isTechnician = (user?: RequestUser | null) => user?.role === "technician";

export const normalizeRelationId = (
  value: null | number | string | { id?: number | string } | undefined,
): number | string | undefined => {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "object") {
    return value.id;
  }

  return value;
};
