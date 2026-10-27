import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import ReviewStatsBreakdown from './ReviewStatsBreakdown';
import ReviewList from './ReviewList';
import ReviewFormModal from './ReviewFormModal';

import { useProductReviews } from '../hooks/useProductReviews';
import { useProductReviewStats } from '../hooks/useProductReviewStats';
import { useVoteHelpful } from '../hooks/useVoteHelpful';
import { useUser } from '../../auth/hooks/useUser';

/**
 * Customer Reviews & Star Distribution Section
 * Orchestrates rating statistics, star distribution filtering, review cards list, and review creation modal.
 */
export default function CustomerReviewsSection({ product }) {
  const [selectedStar, setSelectedStar] = useState(null);
  const [sort, setSort] = useState('-createdAt');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useUser();

  const productId = product?._id;

  // React Query Hooks
  const {
    reviews,
    total,
    isLoading: isLoadingReviews,
  } = useProductReviews(productId, {
    sort,
    rating: selectedStar,
  });

  const {
    percentages,
    isLoading: isLoadingStats,
  } = useProductReviewStats(productId);

  const { voteHelpful, isVoting } = useVoteHelpful(productId);

  const handleOpenReviewModal = () => {
    if (!isAuthenticated) {
      toast('Please sign in to write a customer review.', { icon: '🔒' });
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setIsModalOpen(true);
  };

  if (!product) return null;

  const currentUserId = user?._id || user?.id || null;

  return (
    <section
      id="customer-reviews"
      aria-label="Customer Reviews and Star Ratings"
      className="scroll-mt-24 pt-10 border-t border-gray-200 dark:border-brand-darkborder"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (4 cols): Star Ratings & Distribution Breakdown */}
        <div className="lg:col-span-4 xl:col-span-4">
          <ReviewStatsBreakdown
            ratingsAverage={product.ratingsAverage || 4.5}
            ratingsQuantity={product.ratingsQuantity || 0}
            percentages={percentages}
            selectedStar={selectedStar}
            onSelectStar={setSelectedStar}
            onOpenReviewModal={handleOpenReviewModal}
          />
        </div>

        {/* Right Column (8 cols): Reviews List & Controls */}
        <div className="lg:col-span-8 xl:col-span-8">
          <ReviewList
            reviews={reviews}
            isLoading={isLoadingReviews || isLoadingStats}
            total={total}
            sort={sort}
            onSortChange={setSort}
            selectedStar={selectedStar}
            onVoteHelpful={voteHelpful}
            isVoting={isVoting}
            currentUserId={currentUserId}
            onOpenReviewModal={handleOpenReviewModal}
          />
        </div>
      </div>

      {/* Write Customer Review Portal Modal */}
      {isModalOpen && (
        <ReviewFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={productId}
          productName={product.name}
          productImage={product.imageCover}
        />
      )}
    </section>
  );
}

CustomerReviewsSection.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    imageCover: PropTypes.string,
    ratingsAverage: PropTypes.number,
    ratingsQuantity: PropTypes.number,
  }).isRequired,
};
