import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto min-h-[70vh] w-full max-w-5xl space-y-6 px-4 py-8">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
