import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";

const makeRequest = ({
  pathname,
  token,
}: {
  pathname: string;
  token?: string;
}) =>
  ({
    cookies: {
      get: (name: string) => (name === "payload-token" && token ? { value: token } : undefined),
    },
    nextUrl: { pathname },
    url: `https://example.com${pathname}`,
  }) as any;

describe("middleware route protection", () => {
  it("redirects unauthenticated protected routes to login with next", () => {
    const response = middleware(makeRequest({ pathname: "/tickets" }));
    expect(response.headers.get("location")).toBe("https://example.com/login?next=%2Ftickets");
  });

  it("allows unauthenticated access to /", () => {
    const response = middleware(makeRequest({ pathname: "/" }));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects authenticated users away from /login to /dashboard", () => {
    const response = middleware(makeRequest({ pathname: "/login", token: "abc" }));
    expect(response.headers.get("location")).toBe("https://example.com/dashboard");
  });

  it("redirects authenticated users from / to /dashboard", () => {
    const response = middleware(makeRequest({ pathname: "/", token: "abc" }));
    expect(response.headers.get("location")).toBe("https://example.com/dashboard");
  });
});
