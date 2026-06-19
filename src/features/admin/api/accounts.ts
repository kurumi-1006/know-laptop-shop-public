import type {
  AccountKind,
  CreateStaffValues,
  UpdateAccountValues,
} from "@/features/admin/schemas/accounts";
import {
  createStaffAction,
  updateAccountAction,
} from "@/features/admin/actions/account-actions";
import { apiClient } from "@/lib/axios";

export type ManagedAccount = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  role: "customer" | "staff" | "admin";
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
  phone: string | null;
  addressCount: number;
  lastActiveAt: string | null;
};

export type AccountListResponse = {
  data: ManagedAccount[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    banned: number;
    staff: number;
  };
  permissions: {
    canManage: boolean;
    currentUserId: string;
  };
};

export async function getAccounts({
  kind,
  page,
  pageSize,
  search,
  status,
}: {
  kind: AccountKind;
  page: number;
  pageSize: number;
  search: string;
  status: "all" | "active" | "banned";
}): Promise<AccountListResponse> {
  const { data } = await apiClient.get<AccountListResponse>(
    "/api/admin/accounts",
    {
      params: { kind, page, pageSize, search, status },
      headers: { "Cache-Control": "no-store" },
    },
  );
  return data;
}

export type AccountAddress = {
  id: string;
  type: string;
  isDefault: boolean;
  receiverName: string | null;
  receiverPhone: string | null;
  street: string | null;
  provinceCode: number;
  provinceName: string;
  districtCode: number;
  districtName: string;
  wardCode: number;
  wardName: string;
};

export type AccountSession = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountOrder = {
  id: number;
  status: string;
  total: string;
  createdAt: string;
};

export type AccountFeedback = {
  id: number;
  rating: number;
  content: string | null;
  isVisible: boolean;
  createdAt: string;
  product: { id: number; name: string; slug: string } | null;
};

export type AccountDetail = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  role: "customer" | "staff" | "admin";
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  updatedAt: string;
  accounts: { providerId: string }[];
  profile: {
    phone: string | null;
    birthDate: string | null;
    gender: string | null;
    addresses: AccountAddress[];
  } | null;
  sessions: AccountSession[];
  orders: AccountOrder[];
  feedbacks: AccountFeedback[];
  isTargetAdmin: boolean;
  isTargetStaff: boolean;
  permissions: {
    canManage: boolean;
    canBan: boolean;
    canChangeRole: boolean;
    isSelf: boolean;
  };
  stats: {
    orderCount: number;
    feedbackCount: number;
    wishlistCount: number;
    sessionCount: number;
  };
};

export async function getAccountDetail(
  userId: string,
): Promise<AccountDetail> {
  const { data } = await apiClient.get<AccountDetail>(
    `/api/admin/accounts/${userId}`,
    { headers: { "Cache-Control": "no-store" } },
  );
  return data;
}

export async function createStaff(values: CreateStaffValues) {
  const result = await createStaffAction(values);
  if (!result.ok) throw new Error(result.error);
}

export async function updateAccount(
  userId: string,
  values: UpdateAccountValues,
) {
  const result = await updateAccountAction(userId, values);
  if (!result.ok) throw new Error(result.error);
}
