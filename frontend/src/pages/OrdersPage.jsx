import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HiShoppingBag,
  HiMagnifyingGlass,
  HiXMark,
  HiArrowPath,
  HiInboxStack,
} from 'react-icons/hi2';
import { useMyOrders } from '../features/orders/hooks/useMyOrders';
import OrderCard from '../features/orders/components/OrderCard';

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active & In Transit' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const { orders = [], isLoading, isError, error, refetch } = useMyOrders();
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders by tab and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1) Filter by Status Tab
      if (selectedTab === 'active') {
        if (!['pending', 'processing', 'shipped'].includes(order.orderStatus)) {
          return false;
        }
      } else if (selectedTab === 'delivered') {
        if (order.orderStatus !== 'delivered') return false;
      } else if (selectedTab === 'cancelled') {
        if (order.orderStatus !== 'cancelled') return false;
      }

      // 2) Filter by Search Query (Order # or Item Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order._id?.toLowerCase().includes(query);
        const matchesItem = order.orderItems?.some((item) =>
          item.name?.toLowerCase().includes(query)
        );
        const matchesTracking = order.trackingNumber?.toLowerCase().includes(query);

        return matchesId || matchesItem || matchesTracking;
      }

      return true;
    });
  }, [orders, selectedTab, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-brand-darkborder mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white font-display flex items-center gap-2">
            <span>Your Orders</span>
            {!isLoading && (
              <span className="text-xs sm:text-sm font-normal text-gray-400 dark:text-gray-500">
                ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track package shipments, re-order past items, and download official tax receipts.
          </p>
        </div>

        {/* Live Search Bar for Orders */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <HiMagnifyingGlass className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search all orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-brand-darkcard text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <HiXMark className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-100 dark:border-gray-800 text-xs">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-brand-amber text-slate-950 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-darkcard'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-gray-200 dark:border-brand-darkborder p-6 bg-white dark:bg-brand-darkcard animate-pulse space-y-4"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3" />
              <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error Fallback */}
      {isError && (
        <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center max-w-md mx-auto my-8 space-y-3">
          <p className="text-sm font-bold text-red-900 dark:text-red-300">
            Failed to load your order history
          </p>
          <p className="text-xs text-red-700 dark:text-red-400">
            {error?.message || 'A network error occurred while reaching ApexMart servers.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-full bg-brand-amber text-slate-950 text-xs font-bold shadow-xs hover:bg-brand-hover transition flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <HiArrowPath className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredOrders.length === 0 && (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-brand-amber mx-auto flex items-center justify-center">
            {searchQuery ? (
              <HiMagnifyingGlass className="w-8 h-8" />
            ) : (
              <HiInboxStack className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">
            {searchQuery
              ? 'No matching orders found'
              : selectedTab !== 'all'
                ? `No ${selectedTab} orders`
                : 'No orders placed yet'}
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? `We couldn't find any orders matching "${searchQuery}". Try searching with a different keyword or order ID.`
              : 'When you purchase items from the catalog, your live shipment updates and invoices will appear here.'}
          </p>

          <div className="pt-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-brand-darkborder transition cursor-pointer"
              >
                Clear Search Filter
              </button>
            ) : (
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-xs font-bold shadow-sm transition"
              >
                <HiShoppingBag className="w-4 h-4" />
                <span>Explore ApexMart Catalog</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Rendered Order Cards List */}
      {!isLoading && !isError && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
