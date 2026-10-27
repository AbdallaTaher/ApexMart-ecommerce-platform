import { useState } from 'react';
import PropTypes from 'prop-types';
import { HiStar } from 'react-icons/hi2';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Average',
  4: 'Good',
  5: 'Great!',
};

const SIZE_MAP = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * Reusable Star Rating Component
 * Supports both static fractional display and interactive star selection with hover feedback.
 */
export default function StarRating({
  rating = 0,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showLabel = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const activeRating = interactive && hoverRating > 0 ? hoverRating : rating;
  const starSizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center" role={interactive ? 'radiogroup' : 'img'} aria-label={`${rating} out of ${maxRating} stars`}>
        {[...Array(maxRating)].map((_, idx) => {
          const starValue = idx + 1;
          const isFilled = starValue <= Math.round(activeRating);

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-110 focus:outline-none transition-transform'
                  : 'cursor-default'
              } p-0.5`}
              aria-label={interactive ? `${starValue} star${starValue > 1 ? 's' : ''}` : undefined}
            >
              <HiStar
                className={`${starSizeClass} transition-colors ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 dark:text-amber-400'
                    : 'text-gray-200 dark:text-gray-700'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && activeRating > 0 && (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 animate-fadeIn">
          {RATING_LABELS[activeRating]}
        </span>
      )}
    </div>
  );
}

StarRating.propTypes = {
  rating: PropTypes.number,
  maxRating: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  interactive: PropTypes.bool,
  onRatingChange: PropTypes.func,
  showLabel: PropTypes.bool,
};
