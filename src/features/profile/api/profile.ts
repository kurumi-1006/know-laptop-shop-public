import {
  profileResponseSchema,
  type PersonalInfoValues,
  type ProfileResponse,
  type AddressFormValues,
} from "@/features/profile/schemas/profile";
import {
  updateAddressesAction,
  updatePersonalInfoAction,
} from "@/features/profile/actions/profile-actions";
import { apiClient } from "@/lib/axios";

export async function getProfile(): Promise<ProfileResponse> {
  const { data } = await apiClient.get("/api/profile", {
    headers: { "Cache-Control": "no-store" },
  });
  return profileResponseSchema.parse(data);
}

export async function updatePersonalInfo(values: PersonalInfoValues) {
  const result = await updatePersonalInfoAction(values);
  if (!result.ok) throw new Error(result.error);
  return profileResponseSchema.parse(result.data);
}

export async function updateAddresses(addresses: AddressFormValues[]) {
  const result = await updateAddressesAction(addresses);
  if (!result.ok) throw new Error(result.error);
  return profileResponseSchema.parse(result.data);
}
