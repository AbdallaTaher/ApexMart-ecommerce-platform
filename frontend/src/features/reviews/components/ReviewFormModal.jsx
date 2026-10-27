import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { HiXMark, HiShieldCheck } from 'react-icons/hi2';
import StarRating from './StarRating';
import { useCreateReview } from '../hooks/useCreateReview';
import { useOutsideClick } from '../../../hooks/useOutsideClick';

/**
 * Amazon-Style Create Customer Review Modal
 * Portaled to document.body with outside-click and Escape key listeners.
 */
export default function ReviewFormModal({
  isOpen,
  onClose,
  productId,
  productName = 'Product',
  productImage = '',
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [validationError, setValidationError] = useState('');

  const modalRef = useOutsideClick(onClose);
  const { submitReview, isSubmitting } = useCreateReview(productId, () => {
    // Reset form and close on success
    setTitle('');
    setReview('');
    setRating(5);
    setValidationError('');
    onClose();
  });

  // Handle Escape key to dismiss
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      setValidationError('Please select a star rating between 1 and 5.');
      return;
    }

    if (!review.trim() || review.trim().length < 5) {
      setValidationError('Please write a review with at least 5 characters.');
      return;
    }

    setValidationError('');
    submitReview({
      rating,
      title: title.trim(),
      review: review.trim(),
    });
  };

  const imageUrl = productImage?.startsWith('http')
    ? productImage
    : `/img/products/${productImage || 'default-product.jpg'}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-white dark:bg-brand-darkcard rounded-2xl border border-gray-200 dark:border-brand-darkborder shadow-2xl overflow-hidden animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-brand-darkborder bg-gray-50/50 dark:bg-brand-darkbg/50">
          <div className="flex items-center gap-3 min-w-0">
            {productImage && (
              <img
                src={imageUrl}
                alt={productName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="w-10 h-10 object-contain rounded-md bg-white border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2
                id="review-modal-title"
                className="text-sm sm:text-base font-bold font-display text-gray-950 dark:text-white truncate"
              >
                Create Review
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {productName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-brand-darkborder transition"
            aria-label="Close review dialog"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Overall Star Rating */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="p-3 bg-gray-50 dark:bg-[#151b24] rounded-xl border border-gray-200 dark:border-brand-darkborder flex items-center justify-between">
              <StarRating
                rating={rating}
                size="lg"
                interactive={true}
                showLabel={true}
                onRatingChange={(newVal) => setRating(newVal)}
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* 2. Review Headline / Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="review-headline"
              className="block text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider"
            >
              Add a headline
            </label>
            <input
              id="review-headline"
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's most important to know? (e.g. Great sound and comfortable fit)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-amber transition"
            />
          </div>

          {/* 3. Written Review Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="review-body"
                className="block text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider"
              >
                Write your review <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400 dark:text-gray-400">
                {review.length} / 3000
              </span>
            </div>
            <textarea
              id="review-body"
              rows={4}
              maxLength={3000}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you like or dislike? How does this product perform? Share details to help other buyers."
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-amber transition resize-none"
            />
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-md border border-red-200 dark:border-red-900">
              {validationError}
            </p>
          )}

          {/* Verified Buyer Anti-Spam Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
            <HiShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Verified Purchase Policy:</strong> Reviews are strictly authenticated against your purchase order history. Once submitted, your review will proudly display the <strong>Verified Purchase</strong> badge.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-brand-darkborder">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-darkborder transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

ReviewFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productId: PropTypes.string.isRequired,
  productName: PropTypes.string,
  productImage: PropTypes.string,
};
