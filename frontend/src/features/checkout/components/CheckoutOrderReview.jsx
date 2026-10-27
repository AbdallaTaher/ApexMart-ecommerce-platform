import { HiLockClosed, HiPencilSquare, HiShieldCheck } from 'react-icons/hi2';

/**
 * Step 4 / Final Review: Complete Order Review & Submission
 *
 * @param {Object} props
 * @param {Object} props.shippingAddress - Verified address object
 * @param {string} props.deliverySpeed - 'standard' | 'two_day' | 'next_day'
 * @param {string} props.paymentMethod - 'stripe' | 'cod'
 * @param {Object} props.cardDetails - Card metadata (e.g. number for last 4 digits)
 * @param {Array<Object>} props.items - Valid cart items
 * @param {Object} props.financials - { subtotal, shippingPrice, taxPrice, totalPrice }
 * @param {Function} props.onEditStep - Callback to jump to step 1, 2, or 3
 * @param {Function} props.onPlaceOrder - Submission handler triggering createOrder
 * @param {boolean} props.isSubmitting - Loading state during transactional submission
 */
export default function CheckoutOrderReview({
  shippingAddress,
  deliverySpeed,
  paymentMethod,
  cardDetails,
  items = [],
  financials = {},
  onEditStep,
  onPlaceOrder,
  isSubmitting = false,
}) {
  const { subtotal = 0, shippingPrice = 0, taxPrice = 0, totalPrice = 0 } = financials;

  const speedLabels = {
    standard: 'Standard Shipping (3-5 business days)',
    two_day: 'Two-Day Delivery (2 business days)',
    next_day: 'Next-Day Priority Delivery (Tomorrow)',
  };

  const last4 = cardDetails?.number
    ? cardDetails.number.replace(/\s/g, '').slice(-4)
    : '4242';

  return (
    <div className="space-y-6">
      {/* 3 Overview Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shipping Address */}
        <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                1. Shipping Address
              </h3>
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="text-xs font-semibold text-brand-amber hover:text-brand-hover flex items-center gap-1 cursor-pointer"
              >
                <HiPencilSquare className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {shippingAddress.fullName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              {shippingAddress.street}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {shippingAddress.country}
            </p>
            {shippingAddress.phone && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Phone: {shippingAddress.phone}
              </p>
            )}
          </div>
        </div>

        {/* Delivery Speed */}
        <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                2. Delivery Speed
              </h3>
              <button
                type="button"
                onClick={() => onEditStep(2)}
                className="text-xs font-semibold text-brand-amber hover:text-brand-hover flex items-center gap-1 cursor-pointer"
              >
                <HiPencilSquare className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {speedLabels[deliverySpeed] || 'Standard Shipping'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {shippingPrice === 0 ? 'FREE Shipping' : `$${shippingPrice.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                3. Payment Method
              </h3>
              <button
                type="button"
                onClick={() => onEditStep(3)}
                className="text-xs font-semibold text-brand-amber hover:text-brand-hover flex items-center gap-1 cursor-pointer"
              >
                <HiPencilSquare className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>
            {paymentMethod === 'stripe' ? (
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Credit/Debit Card ending in {last4}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Processed via Stripe Secure Gateway
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Cash on Delivery (COD)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pay cash at delivery
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Items in Order */}
      <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
          Review items ({items.length})
        </h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item, idx) => {
            const product = item.product || {};
            const unitPrice =
              item.unitPrice || product.priceDiscount || product.price || 0;
            const lineTotal = unitPrice * (item.quantity || 1);
            const image = product.imageCover || 'default-product.jpg';
            const imageUrl = image.startsWith('http')
              ? image
              : `/img/products/${image}`;

            return (
              <div key={item._id || item.product?._id || idx} className="py-3 flex items-center gap-4">
                <img
                  src={imageUrl}
                  alt={product.name || 'Product'}
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&q=80';
                  }}
                  className="w-16 h-16 object-contain rounded-md bg-gray-50 dark:bg-brand-slate border border-gray-100 dark:border-gray-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Qty: {item.quantity} &bull; ${unitPrice.toFixed(2)} each
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-sm font-bold text-gray-900 dark:text-white">
                    ${lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Place Order CTA Box */}
      <div className="bg-amber-50/50 dark:bg-brand-darkcard border-2 border-brand-amber/40 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-2">
            <div>Items Subtotal: <strong className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</strong></div>
            <div>Shipping: <strong className="text-gray-900 dark:text-white">{shippingPrice === 0 ? 'FREE' : `$${shippingPrice.toFixed(2)}`}</strong></div>
            <div>Estimated Tax (8%): <strong className="text-gray-900 dark:text-white">${taxPrice.toFixed(2)}</strong></div>
          </div>
          <div className="flex items-baseline gap-2 pt-1 border-t border-amber-200/50 dark:border-gray-800">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Order Total:
            </span>
            <span className="font-display text-2xl font-extrabold text-brand-amber">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-md">
            By placing your order, you agree to ApexMart's Privacy Notice and Conditions of Use.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onPlaceOrder}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-sm font-extrabold shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <HiLockClosed className="w-4 h-4" />
                <span>Place your order</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <HiShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Bank-Grade 256-bit TLS Encryption &bull; ACID Stock Guarantee</span>
      </div>
    </div>
  );
}
