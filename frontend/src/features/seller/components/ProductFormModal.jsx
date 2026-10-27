import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { HiXMark, HiPhoto } from 'react-icons/hi2';
import { useCategories } from '../../products/hooks/useCategories';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import Spinner from '../../../ui/Spinner';

/**
 * Modal dialog for Creating and Editing Seller Store Products
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Object|null} props.productToEdit - Product document if in edit mode, else null
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSubmit - Submission handler
 * @param {boolean} [props.isSubmitting=false] - Whether mutation is pending
 */
export default function ProductFormModal({
  isOpen,
  productToEdit = null,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const isEditMode = Boolean(productToEdit?._id);
  const { categories } = useCategories();
  const modalRef = useRef(null);

  useOutsideClick(modalRef, () => {
    if (!isSubmitting) onClose();
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      brand: '',
      category: '',
      price: '',
      dealDiscountPercentage: 0,
      stock: 10,
      imageCover: '',
      description: '',
      isActive: true,
    },
  });

  const imageCoverPreview = watch('imageCover');

  // Populate form with existing product values when editing
  useEffect(() => {
    if (productToEdit) {
      reset({
        name: productToEdit.name || '',
        brand: productToEdit.brand || '',
        category: productToEdit.category?._id || productToEdit.category || '',
        price: productToEdit.price || '',
        dealDiscountPercentage: productToEdit.dealDiscountPercentage || 0,
        stock: productToEdit.stock !== undefined ? productToEdit.stock : 10,
        imageCover: productToEdit.imageCover || '',
        description: productToEdit.description || '',
        isActive: productToEdit.isActive !== false,
      });
    } else {
      reset({
        name: '',
        brand: '',
        category: categories[0]?._id || '',
        price: '',
        dealDiscountPercentage: 0,
        stock: 10,
        imageCover: '',
        description: '',
        isActive: true,
      });
    }
  }, [productToEdit, categories, reset]);

  if (!isOpen) return null;

  const onFormSubmit = (data) => {
    const payload = {
      ...data,
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      dealDiscountPercentage: parseInt(data.dealDiscountPercentage || 0, 10),
      isDeal: parseInt(data.dealDiscountPercentage || 0, 10) > 0,
    };
    onSubmit(payload);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-brand-darkcard rounded-2xl border border-gray-200 dark:border-brand-darkborder shadow-2xl overflow-hidden animate-scaleUp my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-brand-darkborder bg-gray-50/50 dark:bg-brand-darkbg/50">
          <div>
            <h2
              id="product-modal-title"
              className="text-base sm:text-lg font-bold font-display text-gray-950 dark:text-white"
            >
              {isEditMode ? 'Edit Product Listing' : 'Publish New Product'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isEditMode
                ? 'Update pricing, inventory stock, and description'
                : 'Fill in product specifications to list in the ApexMart marketplace'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-brand-darkborder transition disabled:opacity-50"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4 text-xs">
          {/* Row 1: Title & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sony Wireless Noise-Canceling Headphones"
                {...register('name', {
                  required: 'Product title is required',
                  minLength: { value: 3, message: 'Minimum 3 characters' },
                })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
              {errors.name && (
                <p className="text-red-500 text-[11px]">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sony, Apple, Samsung"
                {...register('brand', { required: 'Brand name is required' })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
              {errors.brand && (
                <p className="text-red-500 text-[11px]">{errors.brand.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Category, Price, Discount, Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category', { required: 'Select a category' })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="29.99"
                {...register('price', {
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Min $0.01' },
                })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
              {errors.price && (
                <p className="text-red-500 text-[11px]">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Deal Discount %
              </label>
              <input
                type="number"
                min="0"
                max="90"
                placeholder="0"
                {...register('dealDiscountPercentage', {
                  min: { value: 0, message: 'Min 0%' },
                  max: { value: 90, message: 'Max 90%' },
                })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Stock Qty <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="10"
                {...register('stock', {
                  required: 'Stock count required',
                  min: { value: 0, message: 'Min 0' },
                })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
          </div>

          {/* Row 3: Image Cover URL & Live Preview */}
          <div className="space-y-1.5">
            <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Cover Image URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                {...register('imageCover', {
                  required: 'Cover image URL is required',
                })}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
              <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imageCoverPreview ? (
                  <img
                    src={imageCoverPreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <HiPhoto className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            {errors.imageCover && (
              <p className="text-red-500 text-[11px]">{errors.imageCover.message}</p>
            )}
          </div>

          {/* Row 4: Product Description */}
          <div className="space-y-1.5">
            <label className="block font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Product Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Highlight key specs, materials, performance features, and warranty details..."
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Minimum 10 characters' },
              })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
            />
            {errors.description && (
              <p className="text-red-500 text-[11px]">{errors.description.message}</p>
            )}
          </div>

          {/* Row 5: Listing Visibility Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 rounded text-brand-amber focus:ring-brand-amber border-gray-300 cursor-pointer"
              />
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Publish as Active (Visible immediately to all buyers in search and catalog)
              </span>
            </label>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-brand-darkborder flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-brand-darkborder text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-amber hover:bg-brand-hover text-slate-950 font-bold shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Product' : 'Publish Product'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
