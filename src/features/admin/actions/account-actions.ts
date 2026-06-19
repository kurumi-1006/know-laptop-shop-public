"use server";

import {
  AccountAccessError,
  AccountManagementFacade,
} from "@/features/admin/lib/account-facade";
import type {
  CreateStaffValues,
  UpdateAccountValues,
} from "@/features/admin/schemas/accounts";
import { auth } from "@/features/auth/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";

type AccountActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createStaffAction(
  values: CreateStaffValues,
): Promise<AccountActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  try {
    await new AccountManagementFacade().createStaff(session?.user, values);
    revalidateAccountPages();
    after(() => {
      console.info("Staff account created", {
        actorId: session?.user.id,
      });
    });
    return { ok: true };
  } catch (error) {
    return accountActionError(error);
  }
}

export async function updateAccountAction(
  userId: string,
  values: UpdateAccountValues,
): Promise<AccountActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  try {
    await new AccountManagementFacade().updateAccount(
      session?.user,
      userId,
      values,
    );
    revalidateAccountPages();
    after(() => {
      console.info("Account updated", {
        actorId: session?.user.id,
        targetId: userId,
        action: values.action,
      });
    });
    return { ok: true };
  } catch (error) {
    return accountActionError(error);
  }
}

function revalidateAccountPages() {
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/staff");
}

function accountActionError(error: unknown): AccountActionResult {
  if (error instanceof AccountAccessError) {
    return { ok: false, error: error.message };
  }

  console.error("Account action failed", error);
  return { ok: false, error: "Unable to update account." };
}
