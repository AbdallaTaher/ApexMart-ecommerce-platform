import PropTypes from 'prop-types';
import { HiXMark } from 'react-icons/hi2';
import StarRating from './StarRating';

/**
 * Amazon-Style Customer Reviews Summary & Star Breakdown Bars
 * Displays overall score, interactive star distribution progress bars, and write review prompt.
 */
export default function ReviewStatsBreakdown({
  ratingsAverage = 4.5,
  ratingsQuantity = 0,
  percentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  selectedStar = null,
  onSelectStar,
  onOpenReviewModal,
}) {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-6">
      {/* 1. Header & Overall Score */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold font-display text-gray-950 dark:text-white">
          Customer Reviews
        </h3>

        <div className="flex items-center gap-3">
          <StarRating rating={ratingsAverage} size="md" />
          <span className="text-base font-bold text-gray-900 dark:text-white">
            {ratingsAverage.toFixed(1)} out of 5
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {ratingsQuantity.toLocaleString()} global rating{ratingsQuantity === 1 ? '' : 's'}
        </p>
      </div>

      {/* 2. Star Distribution Progress Bars */}
      <div className="space-y-2.5">
        {stars.map((star) => {
          const pct = percentages[star] || 0;
          const isSelected = selectedStar === star;

          return (
            <button
              key={star}
              type="button"
              onClick={() => onSelectStar && onSelectStar(isSelected ? null : star)}
              className={`w-full group flex items-center gap-3 text-xs text-left p-1 rounded-md transition ${
                isSelected
                  ? 'bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                  : 'hover:bg-gray-50 dark:hover:bg-brand-darkborder/50'
              }`}
              title={`Filter by ${star} star reviews (${pct}%)`}
            >
              <span className="w-12 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap group-hover:text-brand-hover">
                {star} star
              </span>

              {/* Progress Bar Track */}
              <div className="flex-1 h-4 bg-gray-100 dark:bg-brand-darkborder rounded-full overflow-hidden border border-gray-200 dark:border-gray-800">
                <div
                  className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
                />
              </div>

              <span className="w-9 text-right text-gray-600 dark:text-gray-400 font-semibold">
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Star Filter Clear Badge */}
      {selectedStar && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-200">
            Showing only {selectedStar} star reviews
          </span>
          <button
            type="button"
            onClick={() => onSelectStar(null)}
            className="flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:text-amber-950 font-bold"
          >
            <span>Clear</span>
            <HiXMark className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Write a Review Call-to-Action Card */}
      <div className="pt-6 border-t border-gray-200 dark:border-brand-darkborder space-y-3">
        <h4 className="text-sm font-bold text-gray-950 dark:text-white">
          Review this product
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Share your thoughts with other customers. Honest customer reviews help others make informed purchase decisions.
        </p>

        <button
          type="button"
          onClick={onOpenReviewModal}
          className="w-full py-2.5 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-darkcard text-gray-900 dark:text-white text-xs font-bold shadow-2xs hover:bg-gray-50 dark:hover:bg-brand-darkborder transition cursor-pointer"
        >
          Write a customer review
        </button>
      </div>
    </div>
  );
}

ReviewStatsBreakdown.propTypes = {
  ratingsAverage: PropTypes.number,
  ratingsQuantity: PropTypes.number,
  percentages: PropTypes.object,
  selectedStar: PropTypes.number,
  onSelectStar: PropTypes.func,
  onOpenReviewModal: PropTypes.func,
};
