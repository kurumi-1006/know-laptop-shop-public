import { describe, it, expect } from "vitest";
import {
  addressFormSchema,
  personalInfoSchema,
  emptyAddress,
} from "../schemas/profile";

describe("Profile Schemas", () => {
  describe("personalInfoSchema", () => {

    it("UT-07: chấp nhận số điện thoại Việt Nam hợp lệ (10 chữ số)", () => {
      const result = personalInfoSchema.safeParse({
        phone: "0912345678",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(true);
    });

    it("chấp nhận số điện thoại 11 chữ số (đầu số 03, 07, 08, 09)", () => {
      const result = personalInfoSchema.safeParse({
        phone: "09876543210",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(true);
    });

    it("chấp nhận số điện thoại có khoảng trắng và dấu gạch ngang", () => {
      const result = personalInfoSchema.safeParse({
        phone: "0912 345 678",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(true);
    });

    it("chấp nhận số điện thoại có dấu chấm và ngoặc", () => {
      const result = personalInfoSchema.safeParse({
        phone: "0912.345.678",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(true);
    });

    it("chấp nhận phone rỗng (không bắt buộc)", () => {
      const result = personalInfoSchema.safeParse({
        phone: "",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(true);
    });

    it("từ chối số điện thoại không bắt đầu bằng 0", () => {
      const result = personalInfoSchema.safeParse({
        phone: "1234567890",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối số điện thoại có mã quốc gia (+84)", () => {
      const result = personalInfoSchema.safeParse({
        phone: "+84912345678",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối số điện thoại quá ngắn", () => {
      const result = personalInfoSchema.safeParse({
        phone: "0912",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("số điện thoại");
      }
    });

    it("từ chối số điện thoại quá dài", () => {
      const result = personalInfoSchema.safeParse({
        phone: "0".repeat(25),
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối số điện thoại chứa chữ cái", () => {
      const result = personalInfoSchema.safeParse({
        phone: "0912abc345",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(false);
    });

    it("chấp nhận ngày sinh hợp lệ", () => {
      const result = personalInfoSchema.safeParse({
        phone: "",
        birthDate: "2000-01-15",
        gender: "",
      });
      expect(result.success).toBe(true);
    });

    it("chấp nhận ngày sinh rỗng", () => {
      const result = personalInfoSchema.safeParse({
        phone: "",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(true);
    });


    it("UT-06: từ chối ngày sinh trong tương lai", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = personalInfoSchema.safeParse({
        phone: "",
        birthDate: futureDate.toISOString().slice(0, 10),
        gender: "",
      });
      expect(result.success).toBe(false);
    });

    it("chấp nhận gender male/female/other", () => {
      for (const gender of ["male", "female", "other"]) {
        const result = personalInfoSchema.safeParse({
          phone: "",
          birthDate: "",
          gender,
        });
        expect(result.success).toBe(true);
      }
    });

    it("chấp nhận gender rỗng", () => {
      const result = personalInfoSchema.safeParse({
        phone: "",
        birthDate: "",
        gender: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("addressFormSchema", () => {
    const validAddress = {
      type: "home" as const,
      isDefault: false,
      receiverName: "",
      receiverPhone: "",
      street: "123 Nguyễn Huệ",
      provinceCode: 1,
      provinceName: "Hồ Chí Minh",
      districtCode: 1,
      districtName: "Quận 1",
      wardCode: 1,
      wardName: "Bến Nghé",
    };


    it("UT-08: chấp nhận địa chỉ đầy đủ thông tin", () => {
      const result = addressFormSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it("chấp nhận type work và other", () => {
      for (const type of ["work", "other"] as const) {
        const result = addressFormSchema.safeParse({ ...validAddress, type });
        expect(result.success).toBe(true);
      }
    });


    it("UT-09: từ chối địa chỉ thiếu street", () => {
      const result = addressFormSchema.safeParse({
        ...validAddress,
        street: "",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối địa chỉ thiếu provinceCode (bằng 0)", () => {
      const result = addressFormSchema.safeParse({
        ...validAddress,
        provinceCode: 0,
      });
      expect(result.success).toBe(false);
    });

    it("từ chối địa chỉ thiếu districtCode (bằng 0)", () => {
      const result = addressFormSchema.safeParse({
        ...validAddress,
        districtCode: 0,
      });
      expect(result.success).toBe(false);
    });

    it("từ chối địa chỉ thiếu wardCode (bằng 0)", () => {
      const result = addressFormSchema.safeParse({
        ...validAddress,
        wardCode: 0,
      });
      expect(result.success).toBe(false);
    });

    it("từ chối provinceCode âm", () => {
      const result = addressFormSchema.safeParse({
        ...validAddress,
        provinceCode: -1,
      });
      expect(result.success).toBe(false);
    });

    it("từ chối street quá dài (>200 ký tự)", () => {
      const result = addressFormSchema.safeParse({
        ...validAddress,
        street: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("địa chỉ mặc định có isDefault = true", () => {
      const result = addressFormSchema.safeParse({
        ...validAddress,
        isDefault: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("emptyAddress", () => {
    it("có giá trị mặc định chính xác", () => {
      expect(emptyAddress.type).toBe("home");
      expect(emptyAddress.isDefault).toBe(false);
      expect(emptyAddress.street).toBe("");
      expect(emptyAddress.provinceCode).toBe(0);
      expect(emptyAddress.districtCode).toBe(0);
      expect(emptyAddress.wardCode).toBe(0);
    });
  });
});
