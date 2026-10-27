import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  HiCheckBadge,
  HiHandThumbUp,
  HiUserCircle,
} from 'react-icons/hi2';
import StarRating from './StarRating';

/**
 * Amazon-Style Customer Review Card
 * Displays reviewer profile, star rating, verified purchase badge, review text, and helpful vote button.
 */
export default function ReviewCard({
  review,
  onVoteHelpful,
  isVoting = false,
  currentUserId = null,
}) {
  if (!review) return null;

  const {
    _id,
    title,
    review: reviewText,
    rating,
    isVerifiedPurchase = false,
    helpfulVotes = 0,
    votedUsers = [],
    createdAt,
    user,
  } = review;

  const authorName = user?.name || 'ApexMart Customer';
  const authorPhoto = user?.photo;
  const isAuthor =
    currentUserId &&
    (user?._id?.toString() === currentUserId || user?.id?.toString() === currentUserId);
  const hasVoted =
    currentUserId &&
    Array.isArray(votedUsers) &&
    votedUsers.some(
      (v) => (v?._id || v)?.toString() === currentUserId
    );

  const formattedDate = createdAt
    ? format(new Date(createdAt), 'MMMM d, yyyy')
    : 'Recently';

  return (
    <article className="py-5 border-b border-gray-100 dark:border-brand-darkborder last:border-none space-y-3">
      {/* 1. Reviewer Profile Header */}
      <div className="flex items-center gap-2.5">
        {authorPhoto && !authorPhoto.includes('default') ? (
          <img
            src={authorPhoto.startsWith('http') ? authorPhoto : `/img/users/${authorPhoto}`}
            alt={authorName}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-gray-50"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'block';
            }}
          />
        ) : null}
        <HiUserCircle
          className={`w-8 h-8 text-gray-400 dark:text-gray-500 ${
            authorPhoto && !authorPhoto.includes('default') ? 'hidden' : 'block'
          }`}
        />
        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
          {authorName}
        </span>
      </div>

      {/* 2. Rating & Review Headline */}
      <div className="flex flex-wrap items-center gap-2">
        <StarRating rating={rating} size="sm" />
        {title && (
          <h4 className="text-xs sm:text-sm font-bold text-gray-950 dark:text-white">
            {title}
          </h4>
        )}
      </div>

      {/* 3. Review Timestamp */}
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        Reviewed in the United States on {formattedDate}
      </p>

      {/* 4. Verified Purchase Badge (Amazon Iconic Amber Stamp) */}
      {isVerifiedPurchase && (
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-500">
          <HiCheckBadge className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <span>Verified Purchase</span>
        </div>
      )}

      {/* 5. Review Content */}
      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
        {reviewText}
      </p>

      {/* 6. Helpful Voting Bar */}
      <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
        {helpfulVotes > 0 && (
          <span className="text-gray-500 dark:text-gray-400 text-[11px]">
            {helpfulVotes} {helpfulVotes === 1 ? 'person' : 'people'} found this helpful
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVoteHelpful && onVoteHelpful(_id)}
            disabled={isVoting || isAuthor}
            title={isAuthor ? 'You cannot vote on your own review' : 'Mark this review as helpful'}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition shadow-2xs ${
              hasVoted
                ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-brand-darkcard border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-darkborder'
            } ${
              isAuthor || isVoting
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer hover:border-gray-400'
            }`}
          >
            <HiHandThumbUp
              className={`w-3.5 h-3.5 ${
                hasVoted ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'
              }`}
            />
            <span>{hasVoted ? 'Helpful (Voted)' : 'Helpful'}</span>
          </button>

          {isAuthor && (
            <span className="text-[10px] text-gray-400 italic">
              (Your review)
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    review: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    isVerifiedPurchase: PropTypes.bool,
    helpfulVotes: PropTypes.number,
    votedUsers: PropTypes.array,
    createdAt: PropTypes.string,
    user: PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      name: PropTypes.string,
      photo: PropTypes.string,
    }),
  }).isRequired,
  onVoteHelpful: PropTypes.func,
  isVoting: PropTypes.bool,
  currentUserId: PropTypes.string,
};
