import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

/**
 * Amazon-style Accessible Pagination Controls
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active page number (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.total - Total number of results
 * @param {number} props.limit - Number of results per page
 * @param {Function} props.onPageChange - Handler receiving next page number
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  total = 0,
  limit = 20,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startResult = Math.min((currentPage - 1) * limit + 1, total);
  const endResult = Math.min(currentPage * limit, total);

  // Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Showing <span className="font-bold text-gray-900 dark:text-white">{startResult}</span>–
        <span className="font-bold text-gray-900 dark:text-white">{endResult}</span> of{' '}
        <span className="font-bold text-gray-900 dark:text-white">{total}</span> items
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-semibold flex items-center gap-1"
        >
          <HiChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Number Buttons */}
        {getPageNumbers().map((item, idx) =>
          item === '...' ? (
            <span
              key={`dots-${idx}`}
              className="px-2 py-1 text-xs text-gray-400 select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={currentPage === item ? 'page' : undefined}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                currentPage === item
                  ? 'bg-brand-amber text-slate-950 shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {item}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-semibold flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
