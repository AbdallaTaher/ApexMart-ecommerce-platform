/**
 * Zero-CLS Skeleton Loader for Product Detail Page
 * Maintains identical 3-column dimensions and aspect-ratio geometry to prevent layout shift.
 */
export default function ProductDetailSkeleton() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse space-y-6"
      aria-busy="true"
      aria-label="Loading product details..."
    >
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />

      {/* 3-Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery Skeleton */}
        <div className="lg:col-span-5 flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnail strip */}
          <div className="flex lg:flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
          {/* Main Stage */}
          <div className="flex-1 w-full aspect-square rounded-xl bg-gray-200 dark:bg-gray-800 max-w-[540px]" />
        </div>

        {/* Center Column: Product Info Skeleton */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4">
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded pt-2" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-16 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          <div className="space-y-2 pt-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-24 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>

        {/* Right Column: Buy Box Skeleton */}
        <div className="lg:col-span-3 xl:col-span-3">
          <div className="w-full rounded-xl border border-gray-200 dark:border-brand-darkborder p-5 space-y-4 bg-white dark:bg-brand-darkcard">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-20 w-full bg-gray-200 dark:bg-gray-800 rounded pt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
