"use server";

import { auth } from "@/features/auth/lib/auth";
import {
  ProfileAccessError,
  ProfileFacade,
} from "@/features/profile/lib/profile-facade";
import type {
  AddressFormValues,
  PersonalInfoValues,
  ProfileResponse,
} from "@/features/profile/schemas/profile";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { headers } from "next/headers";

type ProfileActionResult =
  | { ok: true; data: ProfileResponse }
  | { ok: false; error: string };

export async function updatePersonalInfoAction(
  values: PersonalInfoValues,
): Promise<ProfileActionResult> {
  return updateProfile({
    phone: values.phone || null,
    birthDate: values.birthDate || null,
    gender: values.gender || null,
  });
}

export async function updateAddressesAction(
  addresses: AddressFormValues[],
): Promise<ProfileActionResult> {
  return updateProfile({ addresses });
}

async function updateProfile(input: unknown): Promise<ProfileActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  const facade = new ProfileFacade();

  try {
    facade.assertCustomer(session?.user);
    const profile = await facade.updateProfile(session!.user, input);
    revalidatePath("/profile");
    revalidatePath("/address");
    after(() => {
      console.info("Profile updated", {
        userId: session!.user.id,
        updatedAddresses: "addresses" in (input as Record<string, unknown>),
      });
    });
    return {
      ok: true,
      data: JSON.parse(JSON.stringify(profile)) as ProfileResponse,
    };
  } catch (error) {
    if (error instanceof ProfileAccessError) {
      return { ok: false, error: error.message };
    }

    console.error("Profile action failed", error);
    return { ok: false, error: "Unable to update profile." };
  }
}
