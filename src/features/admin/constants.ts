export const ADMIN_ERRORS = {
  adminRequired: "Yêu cầu quyền quản trị.",
  selfManagement: "Bạn không thể thay đổi hoặc khóa tài khoản của chính mình.",
  protectedAdmin: "Tài khoản quản trị viên không thể được quản lý tại đây.",
  forbidden: "Bị cấm",
  accountNotFound: "Không tìm thấy tài khoản.",
  invalidStaffData: "Dữ liệu nhân viên không hợp lệ.",
  invalidUpdate: "Cập nhật tài khoản không hợp lệ.",
  invalidQuery: "Truy vấn không hợp lệ.",
  emailBelongsToCustomer:
    "Email này thuộc về khách hàng. Hãy nâng cấp tài khoản.",
  emailAlreadyExists: "Nhân viên với email này đã tồn tại.",
} as const;

export const DEFAULT_BAN_REASON = "Bị khóa bởi quản trị viên";

export const EMPTY_STAFF_FORM = { name: "", email: "" };
export const SKELETON_ROW_COUNT = 6;
export const SEARCH_DEBOUNCE_MS = 350;
