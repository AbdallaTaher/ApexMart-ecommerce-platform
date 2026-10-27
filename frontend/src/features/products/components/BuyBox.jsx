import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiLockClosed,
  HiShoppingCart,
  HiBolt,
  HiMapPin,
  HiArrowPath,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { useCart } from '../../../context/CartContext';

/**
 * Iconic Amazon-Style Buy Box Component
 * Sticky transaction panel featuring stock availability, quantity selection, Prime delivery, and Add to Cart.
 *
 * @param {Object} props
 * @param {Object} props.product
 */
export default function BuyBox({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  if (!product) return null;

  const {
    price,
    priceDiscount,
    isDeal = false,
    dealDiscountPercentage = 0,
    stock = 10,
    seller,
  } = product;

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Price calculations
  const hasDiscount = (priceDiscount && priceDiscount > 0) || (isDeal && dealDiscountPercentage > 0);
  const currentPrice = hasDiscount && priceDiscount > 0
    ? priceDiscount
    : hasDiscount && dealDiscountPercentage > 0
    ? Math.round(price * (1 - dealDiscountPercentage / 100))
    : price;

  const inStock = stock > 0;
  const isLowStock = inStock && stock <= 5;
  const maxQty = Math.min(stock, 10);

  // Dynamic delivery dates (Tomorrow and Day After Tomorrow)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const formattedTomorrow = tomorrow.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, quantity);
    setTimeout(() => {
      setIsAdding(false);
    }, 200);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  return (
    <aside
      aria-label="Product Purchase Buy Box"
      className="w-full lg:w-[280px] xl:w-[320px] rounded-xl border border-gray-200 dark:border-brand-darkborder bg-white dark:bg-brand-darkcard p-5 shadow-sm space-y-4 self-start lg:sticky lg:top-24"
    >
      {/* 1. Large Price Display */}
      <div className="space-y-1">
        <div className="flex items-start text-gray-950 dark:text-white font-display">
          <span className="text-sm font-semibold mt-1">$</span>
          <span className="text-3xl font-extrabold tracking-tight">
            {Math.floor(currentPrice)}
          </span>
          <span className="text-sm font-semibold mt-1">
            {((currentPrice % 1) * 100).toFixed(0).padStart(2, '0') === '00'
              ? '99'
              : ((currentPrice % 1) * 100).toFixed(0).padStart(2, '0')}
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          No Import Fees Deposit & FREE Shipping to United States
        </p>
      </div>

      {/* 2. Fast Delivery Estimates */}
      <div className="space-y-1.5 text-xs border-t border-b border-gray-100 dark:border-gray-800 py-3">
        <p className="text-gray-800 dark:text-gray-200">
          FREE delivery <strong className="text-gray-950 dark:text-white">{formattedTomorrow}</strong>
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Or fastest delivery <strong className="text-gray-950 dark:text-white">Tomorrow, 8 AM - 12 PM</strong>. Order within <span className="text-emerald-600 dark:text-emerald-400 font-semibold">2 hrs 45 mins</span>.
        </p>
        <div className="flex items-center gap-1.5 text-brand-hover hover:underline cursor-pointer pt-1">
          <HiMapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] font-medium">Deliver to New York 10001</span>
        </div>
      </div>

      {/* 3. Availability Badge */}
      <div>
        {inStock ? (
          isLowStock ? (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Only {stock} left in stock - order soon.
            </span>
          ) : (
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              In Stock
            </span>
          )
        ) : (
          <span className="text-sm font-bold text-red-600 dark:text-red-400">
            Currently Unavailable
          </span>
        )}
      </div>

      {/* 4. Quantity Dropdown (if in stock) */}
      {inStock && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="product-quantity-select"
            className="text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Quantity:
          </label>
          <select
            id="product-quantity-select"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            aria-label="Select quantity to purchase"
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber cursor-pointer shadow-sm"
          >
            {[...Array(maxQty)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 5. Iconic Amazon Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold bg-[#ffd814] hover:bg-[#f7ca00] active:scale-[0.98] text-gray-950 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f7ca00] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiShoppingCart className="w-4 h-4" />
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold bg-[#ffa41c] hover:bg-[#ff8f00] active:scale-[0.98] text-gray-950 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff8f00] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiBolt className="w-4 h-4" />
          Buy Now
        </button>
      </div>

      {/* 6. Secure Transaction & Merchant Details */}
      <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium pb-1">
          <HiLockClosed className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Secure transaction</span>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <span>Ships from</span>
          <span className="font-semibold text-gray-900 dark:text-white">ApexMart</span>
          <span>Sold by</span>
          <span className="font-semibold text-gray-900 dark:text-white truncate">
            {seller?.name || 'ApexMart Official'}
          </span>
          <span>Returns</span>
          <span className="text-gray-900 dark:text-white">30-day refund/replacement</span>
          <span>Payment</span>
          <span className="text-gray-900 dark:text-white">Secure encryption</span>
        </div>
      </div>

      {/* 7. Wishlist / Add to List Link */}
      <button
        type="button"
        onClick={() => toast('Added to your Wishlist!', { icon: '❤️' })}
        className="w-full py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5"
      >
        <HiArrowPath className="w-3.5 h-3.5" />
        Add to Wish List
      </button>
    </aside>
  );
}
