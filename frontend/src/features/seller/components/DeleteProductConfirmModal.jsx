import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { HiExclamationTriangle, HiXMark } from 'react-icons/hi2';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import Spinner from '../../../ui/Spinner';

/**
 * Confirmation dialog before permanently deleting a seller product
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.product - Target product to delete
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm
 * @param {boolean} [props.isDeleting=false]
 */
export default function DeleteProductConfirmModal({
  isOpen,
  product = null,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  const modalRef = useRef(null);

  useOutsideClick(modalRef, () => {
    if (!isDeleting) onClose();
  });

  if (!isOpen || !product) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-brand-darkcard rounded-2xl border border-gray-200 dark:border-brand-darkborder shadow-2xl overflow-hidden animate-scaleUp p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <HiExclamationTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <h3
            id="delete-modal-title"
            className="text-base font-bold font-display text-gray-950 dark:text-white"
          >
            Delete Product Listing?
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-gray-900 dark:text-gray-200">
              "{product.name}"
            </strong>
            ? This action cannot be undone and will permanently remove this item from your store.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-brand-darkborder text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(product._id)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Product</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
