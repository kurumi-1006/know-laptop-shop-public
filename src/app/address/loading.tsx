import { Skeleton } from "@/components/ui/skeleton";

export default function AddressLoading() {
  return (
    <div className="mx-auto min-h-[70vh] w-full max-w-5xl space-y-6 px-4 py-8">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
