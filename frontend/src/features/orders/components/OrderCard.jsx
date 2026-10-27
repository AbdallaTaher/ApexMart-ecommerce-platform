import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  HiDocumentText,
  HiArrowPath,
  HiEye,
  HiXCircle,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

import OrderTimeline from './OrderTimeline';
import OrderInvoiceModal from './OrderInvoiceModal';
import { useCancelOrder } from '../hooks/useCancelOrder';
import { useCart } from '../../../context/CartContext';

/**
 * Amazon-Style Complete Order Card
 * Includes top metadata banner, line items with 'Buy it again', live OrderTimeline, and invoice generation.
 *
 * @param {Object} props
 * @param {Object} props.order - Full order document
 */
export default function OrderCard({ order }) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { addToCart } = useCart();

  if (!order) return null;

  const orderDateFormatted = order.createdAt
    ? format(new Date(order.createdAt), 'MMMM d, yyyy')
    : 'Recently';

  const canCancel =
    order.orderStatus === 'pending' || order.orderStatus === 'processing';

  const handleBuyAgain = (item) => {
    const productObj = item.product?._id
      ? item.product
      : {
          _id: item.product,
          name: item.name,
          price: item.price,
          imageCover: item.imageCover,
        };

    addToCart(productObj, 1);
    toast.success(`Added "${item.name}" back to your cart!`, { icon: '🛒' });
  };

  const handleConfirmCancel = () => {
    cancelOrder({
      orderId: order._id,
      cancellationReason: 'Cancelled by customer via Orders Portal',
    });
    setShowCancelPrompt(false);
  };

  return (
    <article className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-2xl shadow-xs overflow-hidden transition hover:border-gray-300 dark:hover:border-gray-700">
      {/* 1. Amazon-Style Order Meta Header */}
      <header className="bg-gray-50 dark:bg-brand-slate px-5 py-4 border-b border-gray-200 dark:border-brand-darkborder flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">
              Order Placed
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {orderDateFormatted}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">
              Total
            </span>
            <span className="font-display font-extrabold text-brand-amber">
              ${(order.totalPrice || 0).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">
              Ship To
            </span>
            <span
              className="font-semibold text-gray-800 dark:text-gray-200 truncate block max-w-[150px]"
              title={`${order.shippingAddress?.fullName}, ${order.shippingAddress?.city}`}
            >
              {order.shippingAddress?.fullName || 'Customer'}
            </span>
          </div>
        </div>

        {/* Right Header Side: Order # & Invoice CTA */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block sm:text-right">
              Order # {order._id?.slice(-8).toUpperCase()}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowInvoice(true)}
                className="font-semibold text-brand-amber hover:text-brand-hover flex items-center gap-1 cursor-pointer transition"
              >
                <HiDocumentText className="w-3.5 h-3.5" />
                <span>View Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Order Card Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Delivery Status & Stepper */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-display">
              {order.orderStatus === 'delivered' && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Delivered{' '}
                  {order.deliveredAt
                    ? format(new Date(order.deliveredAt), 'MMMM d')
                    : 'to your address'}
                </span>
              )}
              {order.orderStatus === 'shipped' && (
                <span className="text-blue-600 dark:text-blue-400">
                  Shipped &bull; Expected delivery{' '}
                  {order.estimatedDeliveryDate
                    ? format(new Date(order.estimatedDeliveryDate), 'EEEE, MMMM d')
                    : 'soon'}
                </span>
              )}
              {order.orderStatus === 'processing' && (
                <span className="text-amber-600 dark:text-amber-400">
                  Processing &bull; Preparing for dispatch
                </span>
              )}
              {order.orderStatus === 'pending' && (
                <span className="text-gray-700 dark:text-gray-300">
                  Order Received &bull; Awaiting warehouse confirmation
                </span>
              )}
              {order.orderStatus === 'cancelled' && (
                <span className="text-red-600 dark:text-red-400">
                  Cancelled
                </span>
              )}
            </h3>

            {/* Quick Status Pill */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                order.orderStatus === 'delivered'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : order.orderStatus === 'shipped'
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                    : order.orderStatus === 'cancelled'
                      ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
              }`}
            >
              {order.orderStatus}
            </span>
          </div>

          {/* Embedded 4-Step Visual Stepper */}
          <OrderTimeline order={order} />
        </div>

        {/* 3. Line Items Grid */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Items in this order ({order.orderItems?.length || 0})
          </h4>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {order.orderItems?.map((item, idx) => {
              const product = item.product || {};
              const slug = product.slug || item.slug || '';
              const image = item.imageCover || product.imageCover || 'default-product.jpg';
              const imageUrl = image.startsWith('http') ? image : `/img/products/${image}`;

              return (
                <div
                  key={item._id || idx}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&q=80';
                      }}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-lg bg-gray-50 dark:bg-brand-slate border border-gray-100 dark:border-gray-800 flex-shrink-0"
                    />

                    <div className="min-w-0">
                      {slug ? (
                        <Link
                          to={`/products/${slug}`}
                          className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white hover:text-brand-amber dark:hover:text-brand-amber transition line-clamp-2"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {item.name}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Qty: <strong>{item.quantity}</strong> &bull; ${(item.price || 0).toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleBuyAgain(item)}
                      className="px-3 py-1.5 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <HiArrowPath className="w-3.5 h-3.5" />
                      <span>Buy it again</span>
                    </button>

                    {slug && (
                      <Link
                        to={`/products/${slug}`}
                        className="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center gap-1.5"
                      >
                        <HiEye className="w-3.5 h-3.5" />
                        <span>View item</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Bottom Actions: Cancellation & Full Confirmation Link */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            to={`/order-success/${order._id}`}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition font-medium"
          >
            View Full Order Details & Receipt &rarr;
          </Link>

          {canCancel && (
            <div>
              {!showCancelPrompt ? (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HiXCircle className="w-4 h-4" />
                  <span>Request Order Cancellation</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
                  <HiExclamationTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Are you sure? Stock will be released.</span>
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={handleConfirmCancel}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[11px] hover:bg-white dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Keep Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <OrderInvoiceModal order={order} onClose={() => setShowInvoice(false)} />
      )}
    </article>
  );
}
