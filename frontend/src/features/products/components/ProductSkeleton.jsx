/**
 * Skeleton loader matching exact geometry of ProductCard to prevent Cumulative Layout Shift (CLS)
 */
export default function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200 dark:border-brand-darkborder overflow-hidden shadow-sm animate-pulse flex flex-col justify-between">
      {/* Square Image placeholder */}
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800" />

      {/* Content placeholders */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        {/* Title double line */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        {/* Stars */}
        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />

        {/* Price */}
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded" />

        {/* Prime Tag */}
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />

        {/* Button placeholder */}
        <div className="pt-2">
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
