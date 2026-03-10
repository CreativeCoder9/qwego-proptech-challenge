import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "payload";
import { Users } from "@/src/collections/Users";

const getReq = ({
  totalDocs = 1,
  user,
}: {
  totalDocs?: number;
  user?: { id: number | string; role?: "admin" | "manager" | "technician" | "tenant" } | null;
}) => ({
  payload: {
    find: vi.fn().mockResolvedValue({ totalDocs }),
  },
  user: user ?? null,
});

describe("Users collection access", () => {
  it("allows Payload admin portal access only for admin role", () => {
    const adminAccess = Users.access?.admin?.({ req: getReq({ user: { id: 1, role: "admin" } }) as any });
    const managerAccess = Users.access?.admin?.({ req: getReq({ user: { id: 2, role: "manager" } }) as any });

    expect(adminAccess).toBe(true);
    expect(managerAccess).toBe(false);
  });

  it("scopes manager delete access to tenant and technician roles", () => {
    const result = Users.access?.delete?.({
      req: getReq({ user: { id: 2, role: "manager" } }) as any,
    });

    expect(result).toEqual({
      role: {
        in: ["tenant", "technician"],
      },
    });
  });
});

describe("Users collection hooks", () => {
  it("forces first created user role to admin", async () => {
    const hook = Users.hooks?.beforeValidate?.[0];
    const data = { email: "first@example.com", role: "tenant" };

    const result = await hook?.({
      data,
      operation: "create",
      req: getReq({ totalDocs: 0 }) as any,
    } as any);

    expect(result?.role).toBe("admin");
  });

  it("blocks manager from creating admin/manager users", () => {
    const hook = Users.hooks?.beforeChange?.[0];

    expect(() =>
      hook?.({
        data: { role: "admin" },
        operation: "create",
        req: getReq({ user: { id: 10, role: "manager" } }) as any,
      } as any),
    ).toThrow(ValidationError);
  });

  it("blocks manager from updating manager/admin accounts", () => {
    const hook = Users.hooks?.beforeChange?.[0];

    expect(() =>
      hook?.({
        data: { phone: "1234" },
        operation: "update",
        originalDoc: { id: 33, role: "manager" },
        req: getReq({ user: { id: 10, role: "manager" } }) as any,
      } as any),
    ).toThrow(ValidationError);
  });

  it("allows manager to update tenant/technician accounts", () => {
    const hook = Users.hooks?.beforeChange?.[0];

    const result = hook?.({
      data: { role: "technician", name: "Updated" },
      operation: "update",
      originalDoc: { id: 44, role: "tenant" },
      req: getReq({ user: { id: 10, role: "manager" } }) as any,
    } as any);

    expect(result).toEqual({ role: "technician", name: "Updated" });
  });
});
