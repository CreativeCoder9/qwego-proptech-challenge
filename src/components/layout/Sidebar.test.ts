import { describe, expect, it } from "vitest";
import { getNavigationForRole } from "@/src/components/layout/Sidebar";

describe("getNavigationForRole", () => {
  it("includes People route for manager", () => {
    const nav = getNavigationForRole("manager");
    const hrefs = nav.map((item) => item.href);

    expect(hrefs).toContain("/users");
    expect(hrefs).not.toContain("/admin");
  });

  it("includes People and Payload Admin routes for admin", () => {
    const nav = getNavigationForRole("admin");
    const hrefs = nav.map((item) => item.href);

    expect(hrefs).toContain("/users");
    expect(hrefs).toContain("/admin");
  });

  it("falls back to tenant navigation when role is undefined", () => {
    const nav = getNavigationForRole(undefined);
    const hrefs = nav.map((item) => item.href);

    expect(hrefs).toContain("/tickets/new");
    expect(hrefs).not.toContain("/users");
    expect(hrefs).not.toContain("/admin");
  });
});
