import { UserReviewsList } from "@/features/profile/components/user-reviews-list";
import { AccountNavigation } from "@/features/profile/components/account-navigation";
import { StarIcon } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentSession } from "@/features/auth/lib/session";
import { FeedbackFacade } from "@/features/feedback/lib/feedback";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Review History | Know",
  description: "View and manage your product reviews",
};

export default function ProfileReviewsPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ReviewsContent />
    </Suspense>
  );
}

async function ReviewsContent() {
  await connection();
  
  const session = await getCurrentSession();
  if (!session || !session.user) {
    redirect("/login");
  }
  
  const reviews = await FeedbackFacade.getUserFeedbacks(session.user.id);
  
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <StarIcon className="size-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Lịch sử đánh giá
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Xem và quản lý các đánh giá sản phẩm của bạn.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AccountNavigation />
        <div className="min-w-0">
          <UserReviewsList initialReviews={reviews} />
        </div>
      </div>
    </div>
  );
}
