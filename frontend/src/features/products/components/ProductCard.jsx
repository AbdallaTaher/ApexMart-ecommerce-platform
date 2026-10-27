import { Link } from 'react-router-dom';
import { HiStar, HiShoppingCart } from 'react-icons/hi2';
import { useCart } from '../../../context/CartContext';

/**
 * High-Performance, CLS-Protected Product Card
 * Implements explicit image dimensions, WebP rendering, star ratings, and Prime delivery badges.
 *
 * @param {Object} props
 * @param {Object} props.product - The product document from APIFeatures
 */
export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  if (!product) return null;

  const {
    _id,
    name,
    slug,
    price,
    priceDiscount,
    brand = 'ApexMart',
    imageCover,
    ratingsAverage = 4.5,
    ratingsQuantity = 0,
    badge = 'None',
    isDeal = false,
    dealDiscountPercentage = 0,
    stock = 10,
  } = product;

  // Calculate prices
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

  const productUrl = `/product/${slug || _id}`;

  const handleQuickAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <article className="group bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative hover:-translate-y-0.5">
      {/* Top Media & Badges */}
      <div className="relative">
        <Link to={productUrl} className="block overflow-hidden bg-gray-50 dark:bg-gray-800/50 relative">
          <div className="w-full aspect-square flex items-center justify-center p-4">
            <img
              src={imageCover}
              alt={name}
              width="400"
              height="400"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback graceful placeholder if image link 404s
                e.target.onerror = null;
                e.target.src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&fm=webp';
              }}
            />
          </div>
        </Link>

        {/* Dynamic Marketing Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {badge && badge !== 'None' && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow ${
                badge === 'Best Seller'
                  ? 'bg-amber-500 text-slate-950'
                  : badge === "Amazon's Choice"
                  ? 'bg-brand-navy text-brand-amber border border-brand-amber/30'
                  : 'bg-red-600 text-white'
              }`}
            >
              {badge}
            </span>
          )}

          {isDeal && discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Brand & Stock pill */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span className="uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-300">
              {brand}
            </span>
            {stock <= 5 && stock > 0 ? (
              <span className="text-red-500 font-bold text-[10px]">Only {stock} left!</span>
            ) : stock === 0 ? (
              <span className="text-gray-400 font-bold text-[10px]">Out of Stock</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
                In Stock
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 group-hover:text-brand-hover transition leading-snug">
            <Link to={productUrl} title={name}>
              {name}
            </Link>
          </h3>

          {/* Star Rating & Reviews */}
          <div className="flex items-center gap-1.5 text-xs pt-0.5">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <HiStar
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(ratingsAverage)
                      ? 'fill-amber-400 text-amber-400'
                      : i < ratingsAverage
                      ? 'fill-amber-400/70 text-amber-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
              {ratingsAverage?.toFixed(1)}
            </span>
            <span className="text-[11px] text-gray-400">
              ({ratingsQuantity?.toLocaleString() || 0})
            </span>
          </div>

          {/* Price Block */}
          <div className="pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-gray-950 dark:text-white font-display">
                ${currentPrice?.toFixed(2)}
              </span>
              {hasDiscount && originalPrice > currentPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ${originalPrice?.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Prime Delivery Tag */}
          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 pt-0.5">
            <span className="font-extrabold text-[10px] tracking-wide px-1.5 py-0.2 rounded bg-brand-amber/20 dark:bg-brand-amber/30 text-amber-700 dark:text-amber-400 border border-brand-amber/40">
              prime
            </span>
            <span>FREE delivery <strong className="text-gray-900 dark:text-gray-200">Tomorrow</strong></span>
          </div>
        </div>

        {/* Actions Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleQuickAddToCart}
            disabled={stock === 0}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition duration-200 ${
              stock === 0
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-brand-amber hover:bg-brand-hover active:scale-[0.98] text-slate-950 shadow-sm'
            }`}
          >
            <HiShoppingCart className="w-4 h-4" />
            <span>{stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
