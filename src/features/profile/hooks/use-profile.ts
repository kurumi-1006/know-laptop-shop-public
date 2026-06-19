import {
  getProfile,
  updateAddresses,
  updatePersonalInfo,
} from "@/features/profile/api/profile";
import type {
  AddressFormValues,
  PersonalInfoValues,
} from "@/features/profile/schemas/profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const profileQueryKey = ["profile"] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: getProfile,
  });
}

export function useUpdatePersonalInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: PersonalInfoValues) => updatePersonalInfo(values),
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey, profile),
  });
}

export function useUpdateAddresses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addresses: AddressFormValues[]) => updateAddresses(addresses),
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey, profile),
  });
}
