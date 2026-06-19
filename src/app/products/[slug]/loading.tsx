import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {                          }
      <Skeleton className="h-9 w-28 rounded-lg mb-6" />

      {                                       }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {                      }
        <div className="space-y-4">
          <div className="aspect-square bg-muted animate-pulse rounded-2xl" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-20 rounded-lg" />
            ))}
          </div>
        </div>

        {                           }
        <div className="flex flex-col space-y-5">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-36 rounded-md" />
            <Skeleton className="h-5 w-32" />
          </div>

          {                    }
          <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>

          {                      }
          <Skeleton className="h-24 w-full rounded-xl" />

          {                          }
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {                           }
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>

          {                                  }
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          </div>
        </div>
      </div>

      {                                   }
      <div className="mb-12">
        <Skeleton className="h-8 w-56 mb-6" />
        <div className="border rounded-lg overflow-hidden max-w-3xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center px-4 py-3 border-b last:border-0 ${
                i % 2 === 0 ? "bg-muted/20" : "bg-background"
              }`}
            >
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4 ml-4" />
            </div>
          ))}
        </div>
      </div>

      {                              }
      <div className="mb-12">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-8">
          {                    }
          <div className="space-y-3 w-48 shrink-0">
            <Skeleton className="h-16 w-24" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          </div>
          {                 }
          <div className="flex-1 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-xl space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {                               }
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
