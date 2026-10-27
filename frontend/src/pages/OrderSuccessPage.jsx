import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  HiCheckCircle,
  HiTruck,
  HiMapPin,
  HiCreditCard,
  HiArrowRight,
  HiArrowPath,
} from 'react-icons/hi2';
import { useOrder } from '../features/checkout/hooks/useOrder';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { order, isLoading, error } = useOrder(id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-amber rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          Retrieving your order confirmation...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
          ✕
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Order Not Found
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          We could not locate this order or you may not have permission to view it.
        </p>
        <Link
          to="/catalog"
          className="px-6 py-2.5 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-xs font-bold shadow-sm transition"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const deliveryDateFormatted = order.estimatedDeliveryDate
    ? format(new Date(order.estimatedDeliveryDate), 'EEEE, MMMM d, yyyy')
    : 'Estimated in 3-5 business days';

  const orderDateFormatted = order.createdAt
    ? format(new Date(order.createdAt), 'PPP')
    : 'Today';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Amazon-style Success Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <HiCheckCircle className="w-14 h-14 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200 font-display">
              Order placed, thanks!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              Confirmed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 mt-1">
            Confirmation has been dispatched to your email address.
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            Shipping to{' '}
            <strong>
              {order.shippingAddress?.fullName}, {order.shippingAddress?.city}
            </strong>
          </p>
        </div>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-gray-100 dark:border-gray-800 text-xs">
          <div>
            <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold block text-[10px]">
              Order Number
            </span>
            <span className="font-mono font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
              #{order._id?.slice(-8).toUpperCase()}
            </span>
          </div>

          <div>
            <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold block text-[10px]">
              Date Placed
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {orderDateFormatted}
            </span>
          </div>

          <div>
            <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold block text-[10px]">
              Total Amount
            </span>
            <span className="font-display font-extrabold text-brand-amber text-sm sm:text-base">
              ${order.totalPrice?.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold block text-[10px]">
              Payment Status
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize mt-0.5 ${
                order.paymentStatus === 'paid'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Guaranteed Delivery Timeframe Banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-brand-slate border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-brand-amber flex-shrink-0">
            <HiTruck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 block">
              Estimated Delivery
            </span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {deliveryDateFormatted}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              Delivery Speed: {order.deliverySpeed?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* 2-Column Delivery & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Shipping Address */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mb-2">
              <HiMapPin className="w-4 h-4 text-brand-amber" />
              <span>Shipping Destination</span>
            </h3>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              {order.shippingAddress?.fullName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {order.shippingAddress?.street}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
              {order.shippingAddress?.postalCode}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {order.shippingAddress?.country}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mb-2">
              <HiCreditCard className="w-4 h-4 text-brand-amber" />
              <span>Payment Details</span>
            </h3>
            <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">
              {order.paymentMethod === 'stripe' ? 'Stripe Secure Credit Card' : 'Cash on Delivery'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Billing Total: ${order.totalPrice?.toFixed(2)}
            </p>
            {order.idempotencyKey && (
              <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-2 truncate">
                ID: {order.idempotencyKey}
              </p>
            )}
          </div>
        </div>

        {/* Ordered Line Items List */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Items in this shipment ({order.orderItems?.length})
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {order.orderItems?.map((item, idx) => {
              const image = item.imageCover || 'default-product.jpg';
              const imageUrl = image.startsWith('http')
                ? image
                : `/img/products/${image}`;

              return (
                <div key={item._id || idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                      }}
                      className="w-12 h-12 object-contain rounded-md bg-gray-50 dark:bg-brand-slate border border-gray-100 dark:border-gray-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity} &bull; ${item.price?.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Navigation Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/orders"
          className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-darkborder transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <HiArrowPath className="w-4 h-4" />
          <span>Track in Your Orders</span>
        </Link>

        <Link
          to="/catalog"
          className="w-full sm:w-auto px-8 py-3 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue Shopping</span>
          <HiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
