import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-xl">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <CardHeader className="space-y-2 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </CardContent>
    </Card>
  );
}

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 w-full">
      {                     }
      <div className="relative overflow-hidden rounded-2xl border bg-muted/20 p-6 sm:p-8 mb-8">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-64 mt-4" />
        <Skeleton className="h-5 w-96 max-w-full mt-3" />
      </div>

      {               }
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {                              }
        <aside className="hidden lg:block space-y-6">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </aside>

        {                           }
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            <Skeleton className="h-10 w-[160px] rounded-xl" />
          </div>

          <Skeleton className="h-4 w-32" />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
