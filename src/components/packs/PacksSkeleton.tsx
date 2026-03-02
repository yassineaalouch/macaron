export function PacksSkeleton() {
  return (
    <div className="space-y-8">
      {/* Results Info Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl bg-white shadow-md"
          >
            {/* Image Skeleton */}
            <div className="h-64 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />

            {/* Content Skeleton */}
            <div className="space-y-4 p-5">
              {/* Title */}
              <div className="space-y-2">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>

              {/* Items Badge */}
              <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />

              {/* Price */}
              <div className="flex items-end gap-3">
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <div className="h-11 flex-1 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-11 w-11 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center gap-2 py-8">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-10 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
        <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  )
}
