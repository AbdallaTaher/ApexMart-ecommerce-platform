import { Link } from 'react-router-dom';
import { HiTrash, HiBookmark, HiShare, HiExclamationTriangle } from 'react-icons/hi2';
import toast from 'react-hot-toast';

/**
 * Amazon-Style Shopping Cart Item Row
 * Displays product media, live pricing, stock availability, and quantity controls.
 *
 * @param {Object} props
 * @param {Object} props.item - Cart line item object
 * @param {Function} props.onUpdateQuantity - Callback when quantity changes
 * @param {Function} props.onRemove - Callback when item is removed
 */
export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  if (!item) return null;

  const product = item.product || {};
  const productId = product._id || product.id || item.product;
  const productSlug = product.slug || productId;
  const isAvailable = item.isAvailable !== false && product.isActive !== false;
  const isOutOfStock = item.status === 'OUT_OF_STOCK';
  const isLimited = item.status === 'LIMITED_STOCK';
  const isDiscontinued = item.status === 'UNAVAILABLE';

  const unitPrice = item.unitPrice || product.priceDiscount || product.price || 0;
  const originalPrice = product.price || unitPrice;
  const hasDiscount = originalPrice > unitPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100)
    : 0;

  const maxSelectable = Math.min(item.availableStock || product.stock || 10, 10);
  const optionsCount = Math.max(maxSelectable, item.quantity, 1);

  const handleShare = () => {
    const url = `${window.location.origin}/product/${productSlug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Product link copied to clipboard!');
    }
  };

  const handleSaveForLater = () => {
    toast(
      () => (
        <span className="text-xs">
          Saved <strong>{(product.name || 'item').slice(0, 20)}...</strong> for later.
        </span>
      ),
      { icon: '📌' }
    );
  };

  return (
    <article
      aria-label={`Cart item: ${product.name || 'Product'}`}
      className="p-4 sm:p-5 bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200 dark:border-brand-darkborder transition shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
        {/* Product Thumbnail */}
        <Link
          to={`/product/${productSlug}`}
          className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 dark:bg-gray-800/60 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 flex items-center justify-center p-2 relative group"
        >
          <img
            src={product.imageCover || '/default-product.jpg'}
            alt={product.name || 'Product thumbnail'}
            width="128"
            height="128"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.badge && product.badge !== 'None' && (
            <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-navy text-white shadow-xs">
              {product.badge}
            </span>
          )}
        </Link>

        {/* Product Details & Actions */}
        <div className="flex-1 min-w-0 space-y-2 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <Link
                to={`/product/${productSlug}`}
                className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white hover:text-brand-hover transition line-clamp-2"
              >
                {product.name || 'Product Title'}
              </Link>
              {product.brand && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  by <span className="font-medium text-gray-700 dark:text-gray-300">{product.brand}</span>
                </p>
              )}
            </div>

            {/* Price Display */}
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="flex items-baseline sm:justify-end gap-1.5">
                <span className="text-base sm:text-lg font-bold font-display text-gray-950 dark:text-white">
                  ${(unitPrice * (isAvailable ? item.quantity : 0)).toFixed(2)}
                </span>
              </div>
              {hasDiscount && isAvailable && (
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-gray-400">
                  <span className="line-through">${(originalPrice * item.quantity).toFixed(2)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    -{discountPercent}%
                  </span>
                </div>
              )}
              {item.quantity > 1 && isAvailable && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  (${unitPrice.toFixed(2)} each)
                </p>
              )}
            </div>
          </div>

          {/* Stock Status Badges */}
          <div className="text-xs">
            {isDiscontinued && (
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                <HiExclamationTriangle className="w-4 h-4" />
                This product is no longer available.
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                <HiExclamationTriangle className="w-4 h-4" />
                Currently Out of Stock
              </span>
            )}
            {isLimited && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <HiExclamationTriangle className="w-4 h-4" />
                Only {item.availableStock} left in stock - order soon
              </span>
            )}
            {isAvailable && !isLimited && !isOutOfStock && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                In Stock &bull; Eligible for FREE Prime Delivery
              </span>
            )}
          </div>

          {/* Quantity Selector & Operational Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {isAvailable ? (
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1 border border-gray-200 dark:border-gray-700">
                <label htmlFor={`qty-${productId}`} className="text-gray-600 dark:text-gray-400 font-medium">
                  Qty:
                </label>
                <select
                  id={`qty-${productId}`}
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(productId, parseInt(e.target.value, 10))}
                  className="bg-transparent text-gray-900 dark:text-white font-bold focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: Math.min(optionsCount, 15) }, (_, i) => i + 1).map((qty) => (
                    <option
                      key={qty}
                      value={qty}
                      className="bg-white dark:bg-brand-darkcard text-gray-900 dark:text-white"
                    >
                      {qty}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onRemove(productId)}
              className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition py-1 px-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
              aria-label={`Delete ${product.name} from cart`}
            >
              <HiTrash className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">|</span>

            <button
              type="button"
              onClick={handleSaveForLater}
              className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition py-1 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <HiBookmark className="w-3.5 h-3.5" />
              <span>Save for later</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">|</span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition py-1 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <HiShare className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
