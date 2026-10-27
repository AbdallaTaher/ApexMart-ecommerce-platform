import PropTypes from 'prop-types';
import { HiChatBubbleBottomCenterText, HiArrowsUpDown } from 'react-icons/hi2';
import ReviewCard from './ReviewCard';

const SORT_OPTIONS = [
  { value: '-helpfulVotes', label: 'Top Reviews' },
  { value: '-createdAt', label: 'Most Recent' },
  { value: '-rating', label: 'Highest Rating' },
  { value: 'rating', label: 'Lowest Rating' },
];

/**
 * Customer Reviews List Component
 * Features filter controls, sort selector, skeletons, empty states, and review cards.
 */
export default function ReviewList({
  reviews = [],
  isLoading = false,
  total = 0,
  sort = '-createdAt',
  onSortChange,
  selectedStar = null,
  onVoteHelpful,
  isVoting = false,
  currentUserId = null,
  onOpenReviewModal,
}) {
  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Result Count & Sort Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-brand-darkborder text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 dark:text-white">
            {total} {total === 1 ? 'review' : 'reviews'}
          </span>
          {selectedStar && (
            <span className="text-gray-500 dark:text-gray-400">
              filtered by {selectedStar} star
            </span>
          )}
        </div>

        {/* Sort Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="reviews-sort"
            className="text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium"
          >
            <HiArrowsUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </label>
          <select
            id="reviews-sort"
            value={sort}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-darkcard text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-amber transition cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4 py-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="py-4 border-b border-gray-100 dark:border-brand-darkborder animate-pulse space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="w-28 h-3.5 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
              <div className="w-40 h-3.5 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="w-4/5 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && reviews.length === 0 && (
        <div className="py-12 px-4 text-center rounded-2xl bg-gray-50/70 dark:bg-brand-darkbg/40 border border-dashed border-gray-200 dark:border-brand-darkborder space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-brand-darkcard flex items-center justify-center text-gray-400">
            <HiChatBubbleBottomCenterText className="w-6 h-6" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            {selectedStar
              ? `No ${selectedStar}-star customer reviews found`
              : 'No customer reviews yet'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {selectedStar
              ? 'Try selecting a different star rating filter or view all customer reviews.'
              : 'Have you purchased this product? Be the first to share your experience with other customers!'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="px-5 py-2 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Write a Review
            </button>
          </div>
        </div>
      )}

      {/* 4. Review Cards List */}
      {!isLoading && reviews.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-brand-darkborder">
          {reviews.map((rev) => (
            <ReviewCard
              key={rev._id}
              review={rev}
              onVoteHelpful={onVoteHelpful}
              isVoting={isVoting}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

ReviewList.propTypes = {
  reviews: PropTypes.array,
  isLoading: PropTypes.bool,
  total: PropTypes.number,
  sort: PropTypes.string,
  onSortChange: PropTypes.func,
  selectedStar: PropTypes.number,
  onVoteHelpful: PropTypes.func,
  isVoting: PropTypes.bool,
  currentUserId: PropTypes.string,
  onOpenReviewModal: PropTypes.func,
};
