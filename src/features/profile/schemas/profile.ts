import { NAME_MAX_LENGTH, PHONE_MAX_LENGTH, STREET_MAX_LENGTH } from "@/lib/constants";
import { z } from "zod";

export const addressTypeSchema = z.enum(["home", "work", "other"]);

export const addressFormSchema = z.object({
  id: z.string().optional(),
  type: addressTypeSchema,
  isDefault: z.boolean(),
  receiverName: z.string().trim().max(NAME_MAX_LENGTH, "Tên quá dài."),
  receiverPhone: z
    .string()
    .trim()
    .max(PHONE_MAX_LENGTH, "Số điện thoại quá dài.")
    .refine(
      (value) => !value || /^(0[0-9]{9,10})$/.test(value.replace(/[\s().-]/g, '')),
      "Nhập số điện thoại Việt Nam hợp lệ (bắt đầu bằng 0, 10-11 chữ số).",
    ),
  street: z.string().trim().min(1, "Vui lòng nhập địa chỉ đường.").max(STREET_MAX_LENGTH),
  provinceCode: z.number().int().positive("Chọn tỉnh/thành phố."),
  provinceName: z.string(),
  districtCode: z.number().int().positive("Chọn quận/huyện."),
  districtName: z.string(),
  wardCode: z.number().int().positive("Chọn phường/xã."),
  wardName: z.string(),
});

export const personalInfoSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(PHONE_MAX_LENGTH, "Số điện thoại quá dài.")
    .refine(
      (value) => !value || /^(0[0-9]{9,10})$/.test(value.replace(/[\s().-]/g, '')),
      "Nhập số điện thoại Việt Nam hợp lệ (bắt đầu bằng 0, 10-11 chữ số).",
    ),
  birthDate: z
    .string()
    .refine(
      (value) => !value || new Date(`${value}T00:00:00.000Z`) <= new Date(),
      "Ngày sinh không thể ở tương lai.",
    ),
  gender: z.enum(["male", "female", "other"]).or(z.literal("")),
});

export const profileResponseSchema = z.object({
  id: z.string().optional(),
  phone: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable().optional(),
      role: z.string().nullable().optional(),
    })
    .passthrough(),
  addresses: z.array(addressFormSchema),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;

export const emptyAddress: AddressFormValues = {
  type: "home",
  isDefault: false,
  receiverName: "",
  receiverPhone: "",
  street: "",
  provinceCode: 0,
  provinceName: "",
  districtCode: 0,
  districtName: "",
  wardCode: 0,
  wardName: "",
};
