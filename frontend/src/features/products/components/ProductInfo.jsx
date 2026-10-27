import { Link } from 'react-router-dom';
import { HiStar, HiChevronRight, HiCheckBadge, HiShieldCheck } from 'react-icons/hi2';

/**
 * Product Information & Metadata Component
 * Displays breadcrumbs, title, brand store link, star ratings, price breakdown, and specs table.
 *
 * @param {Object} props
 * @param {Object} props.product
 */
export default function ProductInfo({ product }) {
  if (!product) return null;

  const {
    name,
    description,
    price,
    priceDiscount,
    brand = 'ApexMart',
    category,
    ratingsAverage = 4.5,
    ratingsQuantity = 0,
    isDeal = false,
    dealDiscountPercentage = 0,
    badge = 'None',
    specifications = [],
    seller,
  } = product;

  // Price calculations
  const hasDiscount = (priceDiscount && priceDiscount > 0) || (isDeal && dealDiscountPercentage > 0);
  const currentPrice = hasDiscount && priceDiscount > 0
    ? priceDiscount
    : hasDiscount && dealDiscountPercentage > 0
    ? Math.round(price * (1 - dealDiscountPercentage / 100))
    : price;
  const originalPrice = price;
  const discountPercent = dealDiscountPercentage > 0
    ? dealDiscountPercentage
    : hasDiscount && originalPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const categoryName = category?.name || 'All Departments';
  const categorySlug = category?.slug || '';

  return (
    <div className="space-y-5">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-brand-amber hover:underline transition">
          Home
        </Link>
        <HiChevronRight className="w-3 h-3 text-gray-400" />
        <Link
          to={`/catalog?category=${categorySlug}`}
          className="hover:text-brand-amber hover:underline transition"
        >
          {categoryName}
        </Link>
        <HiChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-900 dark:text-gray-200 font-medium truncate max-w-[200px] sm:max-w-xs">
          {name}
        </span>
      </nav>

      {/* 2. Brand & Title */}
      <div className="space-y-1.5">
        <Link
          to={`/catalog?search=${encodeURIComponent(brand)}`}
          className="text-xs font-bold text-brand-hover hover:underline tracking-wide"
        >
          Visit the {brand} Store
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-gray-950 dark:text-white leading-tight">
          {name}
        </h1>
      </div>

      {/* 3. Ratings & Reviews Badge */}
      <div className="flex flex-wrap items-center gap-3 text-xs border-b border-gray-200 dark:border-brand-darkborder pb-4">
        <a
          href="#customer-reviews"
          className="flex items-center gap-1 hover:opacity-80 transition cursor-pointer"
          title="Jump to Customer Reviews"
        >
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            {ratingsAverage.toFixed(1)}
          </span>
          <div className="flex items-center text-brand-amber">
            {[...Array(5)].map((_, i) => (
              <HiStar
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(ratingsAverage)
                    ? 'text-brand-amber fill-brand-amber'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </a>

        <span className="text-gray-400 dark:text-gray-600">|</span>

        <a
          href="#customer-reviews"
          className="text-brand-hover hover:underline font-medium cursor-pointer"
        >
          {ratingsQuantity.toLocaleString()} ratings
        </a>

        {badge && badge !== 'None' && (
          <>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary dark:text-brand-amber text-[11px] font-bold">
              {badge}
            </span>
          </>
        )}
      </div>

      {/* 4. Price & Discount Display */}
      <div className="space-y-2 border-b border-gray-200 dark:border-brand-darkborder pb-5">
        {isDeal && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-600 text-white text-xs font-black uppercase tracking-wider">
            Limited time deal
          </div>
        )}

        <div className="flex items-baseline gap-3">
          {hasDiscount && discountPercent > 0 && (
            <span className="text-2xl sm:text-3xl font-light text-red-600 dark:text-red-400">
              -{discountPercent}%
            </span>
          )}
          <div className="flex items-start text-gray-950 dark:text-white font-display">
            <span className="text-sm font-semibold mt-1">$</span>
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {Math.floor(currentPrice)}
            </span>
            <span className="text-sm font-semibold mt-1">
              {((currentPrice % 1) * 100).toFixed(0).padStart(2, '0') === '00'
                ? '99'
                : ((currentPrice % 1) * 100).toFixed(0).padStart(2, '0')}
            </span>
          </div>
        </div>

        {hasDiscount && originalPrice > currentPrice && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Typical price:{' '}
            <span className="line-through font-medium">${originalPrice.toFixed(2)}</span>
          </p>
        )}
      </div>

      {/* 5. Key Product Specifications Table */}
      <div className="space-y-2 border-b border-gray-200 dark:border-brand-darkborder pb-5">
        <h2 className="text-sm font-bold text-gray-950 dark:text-white uppercase tracking-wider">
          Product Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div className="flex py-1 border-b border-gray-100 dark:border-gray-800">
            <dt className="w-28 text-gray-500 dark:text-gray-400 font-medium">Brand</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{brand}</dd>
          </div>
          <div className="flex py-1 border-b border-gray-100 dark:border-gray-800">
            <dt className="w-28 text-gray-500 dark:text-gray-400 font-medium">Category</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{categoryName}</dd>
          </div>
          {seller?.name && (
            <div className="flex py-1 border-b border-gray-100 dark:border-gray-800">
              <dt className="w-28 text-gray-500 dark:text-gray-400 font-medium">Merchant</dt>
              <dd className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                {seller.name}
                <HiCheckBadge className="w-3.5 h-3.5 text-blue-500 inline" />
              </dd>
            </div>
          )}
          {specifications.map((spec, i) => (
            <div key={i} className="flex py-1 border-b border-gray-100 dark:border-gray-800">
              <dt className="w-28 text-gray-500 dark:text-gray-400 font-medium">{spec.key}</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 6. About This Item / Full Description */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-gray-950 dark:text-white uppercase tracking-wider">
          About this item
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-sans">
          {description}
        </p>

        {/* ApexMart Buyer Protection guarantee */}
        <div className="flex items-center gap-2 p-3 mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
          <HiShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>ApexMart Verified:</strong> 100% Genuine product backed by 30-day money-back guarantee and seller authenticity guarantee.
          </span>
        </div>
      </div>
    </div>
  );
}
