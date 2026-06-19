import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("should return the target path if it starts with a single slash", () => {
    expect(getSafeRedirect("/dashboard/products")).toBe("/dashboard/products");
    expect(getSafeRedirect("/cart?item=1", "/")).toBe("/cart?item=1");
  });

  it("should return the default redirect path if the target URL is external (contains http/https)", () => {
    expect(getSafeRedirect("https://malicious-site.com", "/home")).toBe("/home");
  });

  it("should prevent protocol-relative redirects starting with double slashes", () => {
    expect(getSafeRedirect("//google.com", "/")).toBe("/");
  });

  it("should return fallback when redirect is null, undefined, or empty", () => {
    expect(getSafeRedirect(null, "/")).toBe("/");
    expect(getSafeRedirect(undefined, "/")).toBe("/");
    expect(getSafeRedirect("", "/")).toBe("/");
  });
});
