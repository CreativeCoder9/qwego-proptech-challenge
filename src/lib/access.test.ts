import { describe, expect, it } from "vitest";
import {
  isAdmin,
  isAuthenticated,
  isManager,
  isTechnician,
  isTenant,
  normalizeRelationId,
} from "@/src/lib/access";

describe("access role helpers", () => {
  it("treats admin as admin and manager-level access", () => {
    const user = { id: 1, role: "admin" as const };

    expect(isAdmin(user)).toBe(true);
    expect(isManager(user)).toBe(true);
    expect(isTenant(user)).toBe(false);
    expect(isTechnician(user)).toBe(false);
  });

  it("returns false for unauthenticated/undefined user", () => {
    expect(isAuthenticated(undefined)).toBe(false);
    expect(isAuthenticated(null)).toBe(false);
  });

  it("returns true for authenticated user object", () => {
    expect(isAuthenticated({ id: "u1" })).toBe(true);
  });
});

describe("normalizeRelationId", () => {
  it("normalizes primitive IDs", () => {
    expect(normalizeRelationId(12)).toBe(12);
    expect(normalizeRelationId("abc")).toBe("abc");
  });

  it("normalizes relationship objects", () => {
    expect(normalizeRelationId({ id: 99 })).toBe(99);
    expect(normalizeRelationId({ id: "u-1" })).toBe("u-1");
  });

  it("returns undefined for nullish values", () => {
    expect(normalizeRelationId(undefined)).toBeUndefined();
    expect(normalizeRelationId(null)).toBeUndefined();
  });
});
