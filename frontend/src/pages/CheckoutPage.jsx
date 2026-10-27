import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiLockClosed, HiShieldCheck, HiArrowLeft, HiShoppingBag } from 'react-icons/hi2';
import toast from 'react-hot-toast';

import { useCart } from '../context/CartContext';
import { useUser } from '../features/auth/hooks/useUser';
import { useCreateOrder } from '../features/checkout/hooks/useCreateOrder';

import CheckoutStepper from '../features/checkout/components/CheckoutStepper';
import AddressForm from '../features/checkout/components/AddressForm';
import DeliveryOptions from '../features/checkout/components/DeliveryOptions';
import StripePaymentWrapper from '../features/checkout/components/StripePaymentWrapper';
import CheckoutOrderReview from '../features/checkout/components/CheckoutOrderReview';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { user } = useUser();
  const { createOrderAsync, isCreating } = useCreateOrder();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // Checkout Form States
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });

  const [deliverySpeed, setDeliverySpeed] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [cardDetails, setCardDetails] = useState({
    name: user?.name || '',
    number: '',
    expiry: '',
    cvc: '',
    postalCode: '',
  });

  // Filter available items
  const validItems = useMemo(
    () => items.filter((i) => i.isAvailable !== false && i.quantity > 0),
    [items]
  );

  // Financial calculations
  const financials = useMemo(() => {
    const subtotal =
      Math.round(
        validItems.reduce((acc, item) => {
          const unitPrice =
            item.unitPrice || item.product?.priceDiscount || item.product?.price || 0;
          return acc + unitPrice * (parseInt(item.quantity, 10) || 1);
        }, 0) * 100
      ) / 100;

    let shippingPrice = 0;
    if (deliverySpeed === 'standard') {
      shippingPrice = subtotal >= 35.0 && subtotal > 0 ? 0 : 5.99;
    } else if (deliverySpeed === 'two_day') {
      shippingPrice = 9.99;
    } else if (deliverySpeed === 'next_day') {
      shippingPrice = 14.99;
    }

    const taxPrice = Math.round(subtotal * 0.08 * 100) / 100;
    const totalPrice = Math.round((subtotal + shippingPrice + taxPrice) * 100) / 100;

    return {
      subtotal,
      shippingPrice,
      taxPrice,
      totalPrice,
      itemsCount: validItems.reduce(
        (acc, item) => acc + (parseInt(item.quantity, 10) || 1),
        0
      ),
    };
  }, [validItems, deliverySpeed]);

  // Step 1: Submit Address
  const handleAddressSubmit = (addressData) => {
    setShippingAddress(addressData);
    setCurrentStep(2);
    setMaxStepReached((prev) => Math.max(prev, 2));
  };

  // Step 2: Continue to Payment
  const handleDeliveryContinue = () => {
    setCurrentStep(3);
    setMaxStepReached((prev) => Math.max(prev, 3));
  };

  // Step 3: Continue to Final Review
  const handlePaymentContinue = () => {
    setCurrentStep(4);
    setMaxStepReached((prev) => Math.max(prev, 4));
  };

  // Navigation via Stepper
  const handleStepClick = (targetStep) => {
    if (targetStep <= maxStepReached) {
      setCurrentStep(targetStep);
    }
  };

  // Step 4: Transactional Place Order Execution
  const handlePlaceOrder = async () => {
    if (validItems.length === 0) {
      toast.error('Your cart has no valid items to order.');
      return;
    }

    // Generate client-side Idempotency-Key
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const orderPayload = {
      orderItems: validItems.map((item) => ({
        product: item.product?._id || item.product || item.productId,
        quantity: item.quantity,
      })),
      shippingAddress,
      deliverySpeed,
      paymentMethod,
      idempotencyKey,
    };

    try {
      const result = await createOrderAsync({
        orderData: orderPayload,
        idempotencyKey,
      });

      if (result?.order?._id) {
        // Clear client and server cart state
        await clearCart();

        toast.success('Order placed successfully!', {
          icon: '🎉',
          duration: 4000,
        });

        // Redirect to Order Success Confirmation page
        navigate(`/order-success/${result.order._id}`);
      }
    } catch {
      // Error is handled in useCreateOrder hook
    }
  };

  // Empty cart fallback
  if (validItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-brand-amber mx-auto flex items-center justify-center mb-4">
          <HiShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display mb-2">
          Your cart is currently empty
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          You need at least one in-stock product to proceed through checkout.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/cart"
            className="px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-brand-darkborder transition"
          >
            Return to Cart
          </Link>
          <Link
            to="/catalog"
            className="px-6 py-2.5 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-xs font-bold shadow-sm transition"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Checkout Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-brand-darkborder pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white font-display flex items-center gap-2">
            <span>Checkout</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({financials.itemsCount} {financials.itemsCount === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <HiLockClosed className="w-4 h-4 text-emerald-600" />
          <span>256-bit Secure Checkout</span>
          <Link
            to="/cart"
            className="ml-4 text-brand-amber hover:text-brand-hover flex items-center gap-1 font-semibold"
          >
            <HiArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </Link>
        </div>
      </header>

      {/* Checkout Stepper Progress */}
      <CheckoutStepper
        currentStep={currentStep}
        onStepClick={handleStepClick}
        maxStepReached={maxStepReached}
      />

      {/* Main Grid: Forms (Left) & Sticky Order Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Step Screen */}
        <section className="lg:col-span-8 space-y-6">
          {currentStep === 1 && (
            <AddressForm
              defaultValues={shippingAddress}
              onSubmitAddress={handleAddressSubmit}
            />
          )}

          {currentStep === 2 && (
            <DeliveryOptions
              selectedSpeed={deliverySpeed}
              onSelectSpeed={setDeliverySpeed}
              subtotal={financials.subtotal}
              onContinue={handleDeliveryContinue}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StripePaymentWrapper
              paymentMethod={paymentMethod}
              onSelectPaymentMethod={setPaymentMethod}
              cardDetails={cardDetails}
              onChangeCardDetails={setCardDetails}
              onContinue={handlePaymentContinue}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <CheckoutOrderReview
              shippingAddress={shippingAddress}
              deliverySpeed={deliverySpeed}
              paymentMethod={paymentMethod}
              cardDetails={cardDetails}
              items={validItems}
              financials={financials}
              onEditStep={(step) => setCurrentStep(step)}
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isCreating}
            />
          )}
        </section>

        {/* Right Column: Sticky Financial Summary */}
        <aside
          aria-label="Order Checkout Summary"
          className="lg:col-span-4 bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-5 shadow-sm space-y-4 lg:sticky lg:top-24"
        >
          {/* Top CTA if in Step 4 */}
          {currentStep === 4 && (
            <button
              type="button"
              disabled={isCreating}
              onClick={handlePlaceOrder}
              className="w-full py-3 px-4 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-sm font-extrabold shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreating ? (
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
          )}

          <h2 className="text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
            Order Summary
          </h2>

          <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Items ({financials.itemsCount}):</span>
              <span>${financials.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping & handling:</span>
              <span
                className={
                  financials.shippingPrice === 0
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : ''
                }
              >
                {financials.shippingPrice === 0
                  ? 'FREE'
                  : `$${financials.shippingPrice.toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Estimated tax (8%):</span>
              <span>${financials.taxPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-gray-950 dark:text-white pt-3 border-t border-gray-100 dark:border-gray-800">
              <span>Order Total:</span>
              <span className="font-display text-xl text-brand-amber">
                ${financials.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick Items Thumbnail Preview in Sidebar */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Items in this shipment:
            </h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {validItems.slice(0, 5).map((item, idx) => {
                const img = item.product?.imageCover || 'default-product.jpg';
                const imgSrc = img.startsWith('http') ? img : `/img/products/${img}`;
                return (
                  <div
                    key={item._id || idx}
                    className="relative w-12 h-12 rounded-lg bg-gray-50 dark:bg-brand-slate border border-gray-200 dark:border-gray-700 p-1 flex-shrink-0"
                    title={item.product?.name}
                  >
                    <img
                      src={imgSrc}
                      alt={item.product?.name || 'Item'}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                      }}
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-amber text-slate-950 text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {item.quantity}
                    </span>
                  </div>
                );
              })}
              {validItems.length > 5 && (
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                  +{validItems.length - 5}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <HiShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Instant Stock Reservation &bull; ACID Safe</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
