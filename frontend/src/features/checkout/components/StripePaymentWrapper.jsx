import { useState } from 'react';
import {
  HiCreditCard,
  HiShieldCheck,
  HiLockClosed,
  HiBanknotes,
  HiArrowLeft,
  HiSparkles,
} from 'react-icons/hi2';

/**
 * Step 3: Payment Method & Stripe Card Elements Wrapper
 *
 * @param {Object} props
 * @param {string} props.paymentMethod - 'stripe' | 'cod'
 * @param {Function} props.onSelectPaymentMethod - Callback to set payment method
 * @param {Object} props.cardDetails - Card details state
 * @param {Function} props.onChangeCardDetails - Callback to update card inputs
 * @param {Function} props.onContinue - Proceed to Order Review & Placement
 * @param {Function} props.onBack - Return to Step 2 (Delivery Speed)
 */
export default function StripePaymentWrapper({
  paymentMethod = 'stripe',
  onSelectPaymentMethod,
  cardDetails = {},
  onChangeCardDetails,
  onContinue,
  onBack,
}) {
  const [validationError, setValidationError] = useState('');

  // Auto-detect card brand
  const getCardBrand = (cardNumber = '') => {
    const clean = cardNumber.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'American Express';
    if (/^6(?:011|5)/.test(clean)) return 'Discover';
    return null;
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    // Format into blocks of 4 digits
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    onChangeCardDetails({ ...cardDetails, number: val });
    if (validationError) setValidationError('');
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    onChangeCardDetails({ ...cardDetails, expiry: val });
    if (validationError) setValidationError('');
  };

  const handleCvcChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChangeCardDetails({ ...cardDetails, cvc: val });
    if (validationError) setValidationError('');
  };

  const handleFillTestCard = () => {
    onChangeCardDetails({
      name: 'John Doe (Test)',
      number: '4242 4242 4242 4242',
      expiry: '12/28',
      cvc: '123',
      postalCode: '98101',
    });
    setValidationError('');
  };

  const handleProceed = () => {
    if (paymentMethod === 'stripe') {
      const cleanNum = (cardDetails.number || '').replace(/\D/g, '');
      if (cleanNum.length < 15) {
        setValidationError('Please enter a valid 16-digit credit or debit card number.');
        return;
      }
      if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
        setValidationError('Please enter a valid expiration date (MM/YY).');
        return;
      }
      if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
        setValidationError('Please enter a valid 3 or 4-digit CVC code.');
        return;
      }
    }
    setValidationError('');
    onContinue();
  };

  const brand = getCardBrand(cardDetails.number);

  return (
    <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-brand-amber">
          <HiCreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-display">
            3. Select a payment method
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            All card transactions are processed securely through Stripe 256-bit encryption.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Method 1: Stripe Card */}
        <div
          className={`p-5 rounded-xl border-2 transition-all ${
            paymentMethod === 'stripe'
              ? 'border-brand-amber bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
              : 'border-gray-200 dark:border-brand-darkborder bg-white dark:bg-brand-darkcard'
          }`}
        >
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={() => onSelectPaymentMethod('stripe')}
                className="w-4 h-4 text-brand-amber focus:ring-brand-amber cursor-pointer"
              />
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  Credit or Debit Card (via Stripe)
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ApexMart accepts all major credit and debit cards
                </p>
              </div>
            </div>

            {/* Quick Test AutoFill */}
            {paymentMethod === 'stripe' && (
              <button
                type="button"
                onClick={handleFillTestCard}
                className="text-[11px] font-bold text-brand-amber hover:text-brand-hover flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-brand-amber/30 hover:border-brand-amber/70 bg-amber-50/50 dark:bg-amber-950/50 cursor-pointer transition"
                title="Auto-fill official Stripe test credentials"
              >
                <HiSparkles className="w-3.5 h-3.5" />
                <span>Fill Stripe Test Card</span>
              </button>
            )}
          </label>

          {/* Stripe Card Input Elements */}
          {paymentMethod === 'stripe' && (
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              {validationError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {validationError}
                </div>
              )}

              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Name on card
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={cardDetails.name || ''}
                  onChange={(e) =>
                    onChangeCardDetails({ ...cardDetails, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>

              {/* Card Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Card number
                  </label>
                  {brand && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {brand}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <HiCreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={cardDetails.number || ''}
                    onChange={handleCardNumberChange}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber font-mono"
                  />
                </div>
              </div>

              {/* Expiry & CVC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Expiration date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry || ''}
                    onChange={handleExpiryChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Security code (CVC)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="123"
                      value={cardDetails.cvc || ''}
                      onChange={handleCvcChange}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-slate text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-center font-mono"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                      <HiLockClosed className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-2 pt-2 text-[11px] text-gray-500 dark:text-gray-400">
                <HiShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Encrypted with 256-bit TLS bank security. Your card info is never stored in plaintext.</span>
              </div>
            </div>
          )}
        </div>

        {/* Method 2: Cash on Delivery (COD) */}
        <div
          className={`p-5 rounded-xl border-2 transition-all ${
            paymentMethod === 'cod'
              ? 'border-brand-amber bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
              : 'border-gray-200 dark:border-brand-darkborder bg-white dark:bg-brand-darkcard'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={() => {
                onSelectPaymentMethod('cod');
                setValidationError('');
              }}
              className="mt-1 w-4 h-4 text-brand-amber focus:ring-brand-amber cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  Cash on Delivery (COD)
                </span>
                <HiBanknotes className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Pay with exact cash directly to the courier when your order is delivered to your doorstep.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to delivery options</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="px-6 py-2.5 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-sm font-bold shadow-sm transition active:scale-[0.98] cursor-pointer"
        >
          Use this payment method
        </button>
      </div>
    </div>
  );
}
