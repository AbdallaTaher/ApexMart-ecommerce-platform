import { format } from 'date-fns';
import {
  HiCheck,
  HiTruck,
  HiXCircle,
  HiClipboardDocumentCheck,
  HiBuildingOffice2,
  HiHome,
} from 'react-icons/hi2';

const MILESTONES = [
  { id: 1, key: 'pending', label: 'Order Placed', icon: HiClipboardDocumentCheck },
  { id: 2, key: 'processing', label: 'Processing', icon: HiBuildingOffice2 },
  { id: 3, key: 'shipped', label: 'Shipped', icon: HiTruck },
  { id: 4, key: 'delivered', label: 'Delivered', icon: HiHome },
];

/**
 * 4-Step Visual Delivery Progress Stepper
 *
 * @param {Object} props
 * @param {Object} props.order - Full order document
 */
export default function OrderTimeline({ order }) {
  if (!order) return null;

  const { orderStatus, createdAt, paidAt, shippedAt, deliveredAt, cancelledAt, cancellationReason, trackingNumber, carrier } = order;

  // Handle Cancelled Status
  if (orderStatus === 'cancelled') {
    const cancelDate = cancelledAt
      ? format(new Date(cancelledAt), 'EEEE, MMMM d, yyyy - h:mm a')
      : 'Recently';

    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
        <HiXCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-red-900 dark:text-red-300">
            Order Cancelled on {cancelDate}
          </p>
          <p className="text-red-700 dark:text-red-400 mt-0.5">
            Reason: <em>{cancellationReason || 'Customer requested cancellation'}</em>
          </p>
          <p className="text-[11px] text-red-600/80 dark:text-red-400/70 mt-1">
            All reserved items have been restored to warehouse stock and any settled funds have been queued for refund.
          </p>
        </div>
      </div>
    );
  }

  // Determine current milestone index
  const statusStepMap = {
    pending: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
  };

  const activeStep = statusStepMap[orderStatus] || 1;

  // Helper for milestone timestamps
  const getMilestoneTimestamp = (stepKey) => {
    try {
      if (stepKey === 'pending' && createdAt) {
        return format(new Date(createdAt), 'MMM d, h:mm a');
      }
      if (stepKey === 'processing' && (paidAt || activeStep >= 2)) {
        return paidAt ? format(new Date(paidAt), 'MMM d, h:mm a') : 'Confirmed';
      }
      if (stepKey === 'shipped' && (shippedAt || activeStep >= 3)) {
        return shippedAt ? format(new Date(shippedAt), 'MMM d, h:mm a') : 'Dispatched';
      }
      if (stepKey === 'delivered' && (deliveredAt || activeStep >= 4)) {
        return deliveredAt ? format(new Date(deliveredAt), 'MMM d, h:mm a') : 'Arrived';
      }
      if (stepKey === 'delivered' && order.estimatedDeliveryDate) {
        return `Est. ${format(new Date(order.estimatedDeliveryDate), 'MMM d')}`;
      }
    } catch {
      return '';
    }
    return '';
  };

  return (
    <div className="py-2">
      {/* Carrier & Tracking Code Bar (if shipped) */}
      {(trackingNumber || carrier) && (
        <div className="mb-4 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HiTruck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>
              Carrier: <strong>{carrier || 'Apex Delivery Logistics'}</strong>
            </span>
          </div>
          {trackingNumber && (
            <div className="font-mono text-[11px]">
              Tracking #: <span className="font-bold underline">{trackingNumber}</span>
            </div>
          )}
        </div>
      )}

      {/* 4-Step Stepper Progress Bar */}
      <ol className="flex items-center justify-between relative max-w-xl mx-auto">
        {/* Background Grey Line */}
        <div
          className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-800 -z-0"
          aria-hidden="true"
        />
        {/* Dynamic Green Progress Fill Line */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-300 ease-out -z-0"
          style={{
            width: `${((activeStep - 1) / (MILESTONES.length - 1)) * 90}%`,
          }}
          aria-hidden="true"
        />

        {MILESTONES.map((step) => {
          const isCompleted = step.id < activeStep;
          const isCurrent = step.id === activeStep;
          const StepIcon = step.icon;
          const timestamp = getMilestoneTimestamp(step.key);

          return (
            <li key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Circle Badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950/60'
                    : isCurrent
                      ? 'bg-brand-amber text-slate-950 font-black ring-4 ring-amber-100 dark:ring-amber-950/60 shadow-md animate-pulse'
                      : 'bg-white dark:bg-brand-darkcard border-2 border-gray-300 dark:border-gray-700 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <HiCheck className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>

              {/* Title & Timestamp */}
              <span
                className={`mt-1.5 text-[11px] sm:text-xs font-semibold text-center tracking-tight ${
                  isCurrent
                    ? 'text-brand-amber font-bold'
                    : isCompleted
                      ? 'text-gray-900 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.label}
              </span>

              {timestamp && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {timestamp}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
