import { describe, expect, it } from "vitest";
import { createSlug } from "./slugify";

describe("createSlug", () => {
  it("should convert uppercase to lowercase", () => {
    expect(createSlug("LAPTOP DEll")).toBe("laptop-dell");
  });

  it("should remove Vietnamese accents correctly", () => {
    expect(createSlug("Thương Hiệu Máy Tính Xách Tay Của Tôi")).toBe(
      "thuong-hieu-may-tinh-xach-tay-cua-toi"
    );
  });

  it("should handle multiple spaces and dashes", () => {
    expect(createSlug("  lenovo---thinkpad  l14  ")).toBe("lenovo-thinkpad-l14");
  });

  it("should strip out special characters", () => {
    expect(createSlug("Macbook Pro M3 @2026!")).toBe("macbook-pro-m3-2026");
  });
});
