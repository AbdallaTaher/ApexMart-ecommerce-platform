import { useForm } from 'react-hook-form';
import { HiMapPin, HiUser, HiHome, HiPhone } from 'react-icons/hi2';

/**
 * Step 1: Shipping Address Form
 * Managed using react-hook-form uncontrolled inputs via register
 *
 * @param {Object} props
 * @param {Object} props.defaultValues - Pre-existing address data if user edited or navigated back
 * @param {Function} props.onSubmitAddress - Callback with verified shipping address
 */
export default function AddressForm({ defaultValues = {}, onSubmitAddress }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: defaultValues.fullName || '',
      street: defaultValues.street || '',
      city: defaultValues.city || '',
      state: defaultValues.state || '',
      postalCode: defaultValues.postalCode || '',
      country: defaultValues.country || 'United States',
      phone: defaultValues.phone || '',
    },
  });

  const onSubmit = (data) => {
    onSubmitAddress({
      fullName: data.fullName.trim(),
      street: data.street.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      postalCode: data.postalCode.trim(),
      country: data.country.trim(),
      phone: data.phone.trim(),
    });
  };

  return (
    <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-brand-amber">
          <HiMapPin className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-display">
            1. Select a delivery address
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter the primary address where your order will be delivered.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Full name (First and Last name) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <HiUser className="w-4 h-4" />
            </div>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. John Doe"
              {...register('fullName', {
                required: 'Please enter a full name for delivery.',
                minLength: { value: 3, message: 'Name must be at least 3 characters.' },
              })}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber ${
                errors.fullName
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Street Address */}
        <div>
          <label
            htmlFor="street"
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Street address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <HiHome className="w-4 h-4" />
            </div>
            <input
              id="street"
              type="text"
              placeholder="Street address, P.O. box, company name, c/o"
              {...register('street', {
                required: 'Please enter a street address.',
                minLength: { value: 5, message: 'Please enter a valid street address.' },
              })}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber ${
                errors.street
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
          </div>
          {errors.street && (
            <p className="mt-1 text-xs text-red-500">{errors.street.message}</p>
          )}
        </div>

        {/* City and State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="city"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              placeholder="e.g. Seattle"
              {...register('city', {
                required: 'City is required.',
              })}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber ${
                errors.city
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="state"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              State / Province / Region
            </label>
            <input
              id="state"
              type="text"
              placeholder="e.g. WA"
              {...register('state')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
            />
          </div>
        </div>

        {/* Postal Code and Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="postalCode"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              Postal / ZIP code <span className="text-red-500">*</span>
            </label>
            <input
              id="postalCode"
              type="text"
              placeholder="e.g. 98101"
              {...register('postalCode', {
                required: 'Postal or ZIP code is required.',
                minLength: { value: 3, message: 'Please enter a valid postal code.' },
              })}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber ${
                errors.postalCode
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
            {errors.postalCode && (
              <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              {...register('country', { required: 'Country is required' })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber cursor-pointer"
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Japan">Japan</option>
              <option value="Egypt">Egypt</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
            </select>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Phone number (Optional, for carrier tracking notifications)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <HiPhone className="w-4 h-4" />
            </div>
            <input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              {...register('phone')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-sm font-bold shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            Use this address & continue
          </button>
        </div>
      </form>
    </div>
  );
}
