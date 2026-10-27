import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { HiCheck, HiExclamationTriangle } from 'react-icons/hi2';
import { syncCartApi, clearCartApi } from '../services/apiCart';

const CartContext = createContext();

const LOCAL_STORAGE_KEY = 'apexmart_cart_items_v1';

const DEFAULT_SUMMARY = {
  itemsCount: 0,
  subtotal: 0,
  freeShippingThreshold: 35.0,
  freeShippingEligible: false,
  amountUntilFreeShipping: 35.0,
  shippingFee: 0,
  estimatedTax: 0,
  total: 0,
};

/**
 * Global Shopping Cart Context Provider
 * Manages optimistic client-side updates, localStorage persistence, and live server synchronization.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [hasUnavailableItems, setHasUnavailableItems] = useState(false);
  const [hasStockAdjustments, setHasStockAdjustments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref to prevent duplicate initial sync runs
  const isInitializedRef = useRef(false);

  // Helper to calculate optimistic client summary while waiting for network
  const calculateLocalSummary = (currentItems) => {
    const validItems = currentItems.filter((i) => (i.isAvailable !== false) && i.quantity > 0);
    const itemsCount = validItems.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 1), 0);
    const subtotal = Math.round(
      validItems.reduce((acc, item) => {
        const unitPrice = item.unitPrice || item.product?.priceDiscount || item.product?.price || 0;
        return acc + unitPrice * (parseInt(item.quantity, 10) || 1);
      }, 0) * 100
    ) / 100;

    const freeShippingEligible = subtotal >= 35.0 && subtotal > 0;
    const amountUntilFreeShipping = freeShippingEligible || subtotal === 0
      ? 0
      : Math.round((35.0 - subtotal) * 100) / 100;
    const shippingFee = subtotal === 0 || freeShippingEligible ? 0 : 5.99;
    const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shippingFee + estimatedTax) * 100) / 100;

    return {
      itemsCount,
      subtotal,
      freeShippingThreshold: 35.0,
      freeShippingEligible,
      amountUntilFreeShipping,
      shippingFee,
      estimatedTax,
      total,
    };
  };

  /**
   * Authoritative Server Synchronization
   */
  const syncWithServer = useCallback(async (itemsToSync, action = 'replace') => {
    if (!itemsToSync || !Array.isArray(itemsToSync)) return;

    setIsSyncing(true);
    try {
      const payload = itemsToSync.map((item) => ({
        product: item.product?._id || item.product || item.productId,
        quantity: item.quantity,
      }));

      const serverCart = await syncCartApi(payload, action);

      if (serverCart) {
        setItems(serverCart.items || []);
        setSummary(serverCart.summary || DEFAULT_SUMMARY);
        setHasUnavailableItems(Boolean(serverCart.hasUnavailableItems));
        setHasStockAdjustments(Boolean(serverCart.hasStockAdjustments));

        // Persist verified items to localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverCart.items || []));
        } catch {
          // ignore localStorage quota errors
        }

        // Notify user if inventory constraints were applied by server
        if (serverCart.hasStockAdjustments) {
          toast(
            () => (
              <div className="flex items-center gap-2">
                <HiExclamationTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-semibold">
                  Some item quantities were adjusted to match current warehouse stock.
                </span>
              </div>
            ),
            { id: 'stock-adjusted-toast' }
          );
        }
      }
    } catch {
      // If network fails, maintain local state
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  // Initial mount: hydrate and verify with backend
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      if (items.length > 0) {
        setSummary(calculateLocalSummary(items));
        syncWithServer(items, 'merge');
      } else {
        setIsLoading(false);
      }
    }
  }, [items, syncWithServer]);

  /**
   * Add Item to Cart
   * Accepts product document or object, plus quantity.
   */
  const addToCart = useCallback((product, quantityToAdd = 1) => {
    if (!product) return;

    const productId = product._id || product.id || product.productId;
    const qty = parseInt(quantityToAdd, 10) || 1;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => (item.product?._id || item.product) === productId
      );

      let updated;
      if (existingIndex > -1) {
        updated = [...prevItems];
        const currentQty = updated[existingIndex].quantity || 1;
        const maxStock = product.stock || 99;
        const newQty = Math.min(currentQty + qty, maxStock, 99);

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          lineTotal: (updated[existingIndex].unitPrice || product.price) * newQty,
        };
      } else {
        const unitPrice = product.priceDiscount && product.priceDiscount > 0
          ? product.priceDiscount
          : product.isDeal && product.dealDiscountPercentage > 0
          ? Math.round(product.price * (1 - product.dealDiscountPercentage / 100))
          : product.price;

        const newItem = {
          product: {
            _id: productId,
            name: product.name,
            slug: product.slug,
            imageCover: product.imageCover,
            brand: product.brand,
            badge: product.badge,
            price: product.price,
            priceDiscount: product.priceDiscount,
            stock: product.stock,
            isActive: product.isActive !== false,
          },
          quantity: Math.min(qty, product.stock || 99, 99),
          unitPrice,
          lineTotal: unitPrice * Math.min(qty, product.stock || 99, 99),
          status: 'IN_STOCK',
          isAvailable: true,
          availableStock: product.stock,
          message: 'In stock',
        };
        updated = [newItem, ...prevItems];
      }

      setSummary(calculateLocalSummary(updated));
      syncWithServer(updated, 'replace');
      return updated;
    });

    toast.success(
      () => (
        <div className="flex items-center gap-2">
          <HiCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-semibold">
            Added <strong className="text-brand-amber">{qty}x</strong> of{' '}
            <span className="text-gray-900 dark:text-white font-bold">
              {(product.name || 'item').slice(0, 24)}...
            </span>{' '}
            to your cart!
          </span>
        </div>
      ),
      { id: `cart-add-${productId}` }
    );
  }, [syncWithServer]);

  /**
   * Update quantity of an item
   */
  const updateQuantity = useCallback((productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);

    setItems((prevItems) => {
      let updated;
      if (qty <= 0) {
        updated = prevItems.filter(
          (item) => (item.product?._id || item.product) !== productId
        );
      } else {
        updated = prevItems.map((item) => {
          if ((item.product?._id || item.product) === productId) {
            const effective = Math.min(qty, item.product?.stock || 99, 99);
            return {
              ...item,
              quantity: effective,
              effectiveQuantity: effective,
              lineTotal: Math.round(item.unitPrice * effective * 100) / 100,
            };
          }
          return item;
        });
      }

      setSummary(calculateLocalSummary(updated));
      syncWithServer(updated, 'replace');
      return updated;
    });
  }, [syncWithServer]);

  /**
   * Remove item completely from cart
   */
  const removeFromCart = useCallback((productId) => {
    setItems((prevItems) => {
      const targetItem = prevItems.find(
        (i) => (i.product?._id || i.product) === productId
      );
      const updated = prevItems.filter(
        (item) => (item.product?._id || item.product) !== productId
      );

      setSummary(calculateLocalSummary(updated));
      syncWithServer(updated, 'replace');

      if (targetItem) {
        toast(
          () => (
            <span className="text-xs">
              Removed <strong>{(targetItem.product?.name || 'Item').slice(0, 22)}...</strong> from cart.
            </span>
          ),
          { icon: '🗑️' }
        );
      }

      return updated;
    });
  }, [syncWithServer]);

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(async () => {
    setItems([]);
    setSummary(DEFAULT_SUMMARY);
    setHasUnavailableItems(false);
    setHasStockAdjustments(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    try {
      await clearCartApi();
    } catch {
      // guest or offline
    }

    toast.success('Cart cleared', { id: 'cart-cleared' });
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        hasUnavailableItems,
        hasStockAdjustments,
        isLoading,
        isSyncing,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: () => syncWithServer(items, 'replace'),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Custom hook to consume Shopping Cart state and actions
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
