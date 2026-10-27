import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiExclamationTriangle, HiArrowLeft } from 'react-icons/hi2';

import { useProduct } from '../features/products/hooks/useProduct';
import ImageGallery from '../features/products/components/ImageGallery';
import ProductInfo from '../features/products/components/ProductInfo';
import BuyBox from '../features/products/components/BuyBox';
import ProductDetailSkeleton from '../features/products/components/ProductDetailSkeleton';
import DealsScroller from '../features/products/components/DealsScroller';
import CustomerReviewsSection from '../features/reviews/components/CustomerReviewsSection';

/**
 * Amazon-Style Iconic Product Detail Page
 * 3-Column Responsive Architecture:
 * - Col 1: Interactive Multi-Angle Gallery with Zoom
 * - Col 2: In-Depth Product Metadata, Ratings & Specifications
 * - Col 3: Sticky Buy Box with Live Stock & Quick Cart Action
 */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const { product, isLoading, isError, error } = useProduct(slug);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [slug]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (isError || !product) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
          <HiExclamationTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-gray-950 dark:text-white">
          Product Not Found
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {error?.response?.data?.message ||
            "We couldn't find the product you're looking for. It may have been discontinued or the URL might be incorrect."}
        </p>
        <div className="pt-4">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold transition shadow-sm"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
        </div>
      </main>
    );
  }

  // Merge primary cover image with additional gallery photos
  const allImages = [
    product.imageCover,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Primary 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Multi-Angle Interactive Gallery */}
        <section aria-label="Product Media" className="lg:col-span-5">
          <ImageGallery
            images={allImages}
            title={product.name}
            badge={product.badge}
          />
        </section>

        {/* Center Column: Product Information & Specifications */}
        <section aria-label="Product Specifications" className="lg:col-span-4 xl:col-span-4">
          <ProductInfo product={product} />
        </section>

        {/* Right Column: Sticky Iconic Amazon Buy Box */}
        <section aria-label="Purchase Options" className="lg:col-span-3 xl:col-span-3">
          <BuyBox product={product} />
        </section>
      </div>

      {/* Customer Reviews & Ratings Engine */}
      <CustomerReviewsSection product={product} />

      {/* Bottom Section: Related Deals Feed */}
      <section aria-label="Related Product Recommendations" className="pt-8 border-t border-gray-200 dark:border-brand-darkborder">
        <DealsScroller
          title="Related Prime Deals You Might Like"
          subtitle="Explore discounted items from top rated sellers"
        />
      </section>
    </main>
  );
}
