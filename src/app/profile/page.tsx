import { ProfilePage as ProfilePageContent } from "@/features/profile/components/profile-page";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Profile | Know",
  description: "Manage your personal information",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<AccountPageFallback />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  await connection();
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <ProfilePageContent />
    </div>
  );
}

function AccountPageFallback() {
  return <div className="mx-auto min-h-[70vh] w-full max-w-5xl px-4 py-8" />;
}
