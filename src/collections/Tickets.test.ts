import { describe, expect, it } from "vitest";
import { ValidationError } from "payload";
import { Tickets } from "@/src/collections/Tickets";

const getReq = (user?: { id: number | string; role?: "admin" | "manager" | "technician" | "tenant" } | null) => ({
  user: user ?? null,
});

describe("Tickets collection access", () => {
  it("scopes tenant read access to own tickets", () => {
    const result = Tickets.access?.read?.({
      req: getReq({ id: 101, role: "tenant" }) as any,
    });

    expect(result).toEqual({
      tenant: {
        equals: 101,
      },
    });
  });

  it("scopes technician update access to assigned tickets", () => {
    const result = Tickets.access?.update?.({
      req: getReq({ id: "tech-1", role: "technician" }) as any,
    });

    expect(result).toEqual({
      assignedTo: {
        equals: "tech-1",
      },
    });
  });
});

describe("Tickets hooks", () => {
  it("normalizes tenant-created tickets in beforeValidate", () => {
    const hook = Tickets.hooks?.beforeValidate?.[0];
    const result = hook?.({
      data: { assignedTo: 99, status: "done", title: "Broken" },
      operation: "create",
      req: getReq({ id: 55, role: "tenant" }) as any,
    } as any);

    expect(result).toMatchObject({
      tenant: 55,
      status: "open",
    });
    expect(result?.assignedTo).toBeUndefined();
  });

  it("rejects invalid status transitions", () => {
    const hook = Tickets.hooks?.beforeChange?.[0];

    expect(() =>
      hook?.({
        data: { status: "done" },
        operation: "update",
        originalDoc: { assignedTo: 5, status: "assigned" },
        req: getReq({ id: 1, role: "manager" }) as any,
      } as any),
    ).toThrow(ValidationError);
  });

  it("auto-updates open status to assigned when assignee is added", () => {
    const hook = Tickets.hooks?.beforeChange?.[0];
    const data = { assignedTo: 20, status: "open" };

    const result = hook?.({
      data,
      operation: "update",
      originalDoc: { status: "open" },
      req: getReq({ id: 1, role: "manager" }) as any,
    } as any);

    expect(result?.status).toBe("assigned");
  });

  it("blocks technician reassignment attempts", () => {
    const hook = Tickets.hooks?.beforeChange?.[0];

    expect(() =>
      hook?.({
        data: { assignedTo: "tech-2", status: "in-progress" },
        operation: "update",
        originalDoc: { assignedTo: "tech-1", status: "assigned" },
        req: getReq({ id: "tech-1", role: "technician" }) as any,
      } as any),
    ).toThrow(ValidationError);
  });

  it("sets resolvedAt when ticket moves to done", () => {
    const hook = Tickets.hooks?.beforeChange?.[0];
    const data = { assignedTo: "tech-1", status: "done" };

    const result = hook?.({
      data,
      operation: "update",
      originalDoc: { assignedTo: "tech-1", status: "in-progress" },
      req: getReq({ id: 1, role: "manager" }) as any,
    } as any);

    expect(typeof result?.resolvedAt).toBe("string");
    expect(Number.isNaN(new Date(result?.resolvedAt as string).getTime())).toBe(false);
  });
});
