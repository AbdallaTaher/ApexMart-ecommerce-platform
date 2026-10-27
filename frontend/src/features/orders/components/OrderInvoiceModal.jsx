import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import {
  HiXMark,
  HiPrinter,
  HiShieldCheck,
  HiShoppingBag,
} from 'react-icons/hi2';
import { useOutsideClick } from '../../../hooks/useOutsideClick';

/**
 * Amazon-Style Printable Itemized Tax Invoice Modal
 * Rendered via createPortal directly into document.body to prevent z-index collisions.
 *
 * @param {Object} props
 * @param {Object} props.order - Full order document
 * @param {Function} props.onClose - Modal close handler
 */
export default function OrderInvoiceModal({ order, onClose }) {
  const modalRef = useOutsideClick(onClose);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const orderDate = order.createdAt
    ? format(new Date(order.createdAt), 'MMMM d, yyyy')
    : 'Recent';

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="bg-white text-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-gray-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gray-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <HiShoppingBag className="w-5 h-5 text-brand-amber" />
            <span className="font-bold text-sm tracking-tight">
              ApexMart Official Invoice
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-amber hover:bg-brand-hover text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <HiPrinter className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice modal"
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-6 sm:p-10 space-y-6 text-xs text-gray-800">
          {/* Header Brand & Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-display text-2xl font-black text-gray-950 tracking-tight">
                  Apex<span className="text-brand-amber">Mart</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">
                  Retail
                </span>
              </div>
              <p className="text-gray-500">
                ApexMart Marketplace Services LLC &bull; 410 Terry Ave N, Seattle, WA
              </p>
              <p className="text-gray-500">support@apexmart.com &bull; www.apexmart.com</p>
            </div>

            <div className="sm:text-right space-y-1">
              <h1
                id="invoice-title"
                className="text-lg font-black uppercase tracking-wider text-gray-950"
              >
                Tax Invoice / Receipt
              </h1>
              <p>
                <strong>Invoice Date:</strong> {orderDate}
              </p>
              <p className="font-mono">
                <strong>Order #:</strong> #{order._id?.slice(-8).toUpperCase()}
              </p>
              <p className="text-[11px] text-gray-500">
                Full Ref: <span className="font-mono">{order._id}</span>
              </p>
            </div>
          </div>

          {/* Two Columns: Shipping & Billing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200/70">
            <div>
              <h2 className="text-[11px] uppercase tracking-wider font-extrabold text-gray-500 mb-1.5">
                Shipping Address
              </h2>
              <p className="font-bold text-gray-950 text-sm">
                {order.shippingAddress?.fullName}
              </p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p className="text-gray-500 mt-1">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>

            <div>
              <h2 className="text-[11px] uppercase tracking-wider font-extrabold text-gray-500 mb-1.5">
                Payment & Fulfillment
              </h2>
              <p>
                <strong>Payment Method:</strong>{' '}
                <span className="capitalize">
                  {order.paymentMethod === 'stripe'
                    ? 'Credit / Debit Card (Stripe Verified)'
                    : 'Cash on Delivery (COD)'}
                </span>
              </p>
              <p>
                <strong>Payment Status:</strong>{' '}
                <span className="font-bold uppercase text-emerald-700">
                  {order.paymentStatus}
                </span>
              </p>
              <p>
                <strong>Delivery Speed:</strong>{' '}
                <span className="capitalize">{order.deliverySpeed?.replace('_', ' ')}</span>
              </p>
              {order.trackingNumber && (
                <p className="mt-1 font-mono">
                  <strong>Tracking:</strong> {order.trackingNumber} ({order.carrier || 'Logistics'})
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {order.orderItems?.map((item, idx) => {
                  const lineTotal = (item.price || 0) * (item.quantity || 1);
                  return (
                    <tr key={item._id || idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          ID: {item.product?._id || item.product || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${(item.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        ${lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span>${(order.itemsPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping & Handling:</span>
                <span>
                  {order.shippingPrice === 0
                    ? 'FREE'
                    : `$${(order.shippingPrice || 0).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax (8%):</span>
                <span>${(order.taxPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-gray-950 pt-2 border-t border-gray-300">
                <span>Order Total:</span>
                <span className="font-display text-base text-gray-950">
                  ${(order.totalPrice || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal & Compliance Footer */}
          <div className="border-t border-gray-200 pt-4 text-[10px] text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <HiShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certified Authenticated Electronic Invoice</span>
            </div>
            <span>Page 1 of 1 &bull; Powered by ApexMart E-Commerce Engine</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
