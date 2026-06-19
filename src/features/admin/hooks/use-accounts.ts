import {
  createStaff,
  getAccountDetail,
  getAccounts,
  updateAccount,
} from "@/features/admin/api/accounts";
import type {
  AccountKind,
  CreateStaffValues,
  UpdateAccountValues,
} from "@/features/admin/schemas/accounts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const accountsQueryKey = ["admin", "accounts"] as const;

export function useAccounts({
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
}) {
  return useQuery({
    queryKey: [...accountsQueryKey, kind, page, pageSize, search, status],
    queryFn: () => getAccounts({ kind, page, pageSize, search, status }),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateStaffValues) => createStaff(values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      values,
    }: {
      userId: string;
      values: UpdateAccountValues;
    }) => updateAccount(userId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}

export const accountDetailQueryKey = (userId: string) =>
  [...accountsQueryKey, "detail", userId] as const;

export function useAccountDetail(userId: string) {
  return useQuery({
    queryKey: accountDetailQueryKey(userId),
    queryFn: () => getAccountDetail(userId),
    enabled: Boolean(userId),
  });
}

