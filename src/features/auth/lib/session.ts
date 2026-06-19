import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";

export const getCurrentSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
