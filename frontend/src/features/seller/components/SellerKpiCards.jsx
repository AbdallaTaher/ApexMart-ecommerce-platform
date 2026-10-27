import {
  HiCurrencyDollar,
  HiShoppingBag,
  HiClipboardDocumentList,
  HiCube,
  HiExclamationTriangle,
  HiStar,
} from 'react-icons/hi2';

/**
 * Seller KPI Metrics Cards
 * @param {Object} props
 * @param {Object} props.metrics
 * @param {boolean} [props.isLoading=false]
 */
export default function SellerKpiCards({ metrics = {}, isLoading = false }) {
  const cards = [
    {
      id: 'revenue',
      title: 'Store Revenue',
      value: `$${(metrics.totalRevenue || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: 'Net sales from paid orders',
      icon: HiCurrencyDollar,
      accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Revenue',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'units',
      title: 'Units Sold',
      value: (metrics.totalUnitsSold || 0).toLocaleString('en-US'),
      subtitle: 'Total items delivered',
      icon: HiShoppingBag,
      accent: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      badge: 'Volume',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      id: 'orders',
      title: 'Store Orders',
      value: (metrics.totalOrders || 0).toLocaleString('en-US'),
      subtitle: 'Customer checkouts',
      icon: HiClipboardDocumentList,
      accent: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      badge: 'Orders',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
    {
      id: 'products',
      title: 'Active Products',
      value: `${metrics.activeProducts || 0} / ${metrics.totalProducts || 0}`,
      subtitle: 'Published in store',
      icon: HiCube,
      accent: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20',
      badge: 'Catalog',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'lowStock',
      title: 'Low Stock Alert',
      value: metrics.lowStockProducts || 0,
      subtitle: metrics.lowStockProducts > 0 ? 'Requires replenishment' : 'Inventory healthy',
      icon: HiExclamationTriangle,
      accent:
        metrics.lowStockProducts > 0
          ? 'text-red-500 bg-red-500/10 border-red-500/20'
          : 'text-gray-400 bg-gray-500/10 border-gray-500/20',
      badge: metrics.lowStockProducts > 0 ? 'Action Needed' : 'Good',
      badgeColor:
        metrics.lowStockProducts > 0
          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    {
      id: 'rating',
      title: 'Store Rating',
      value: `${metrics.averageRating || '0.0'} ★`,
      subtitle: `${metrics.totalReviews || 0} buyer reviews`,
      icon: HiStar,
      accent: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      badge: 'Reputation',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="w-20 h-6 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="w-28 h-3 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="p-4 rounded-xl bg-white dark:bg-brand-darkcard border border-gray-200/90 dark:border-brand-darkborder shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`p-2 rounded-lg border ${c.accent}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.badgeColor}`}
              >
                {c.badge}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                {c.title}
              </p>
              <h4 className="text-lg sm:text-xl font-bold font-display text-gray-950 dark:text-white mt-0.5 tracking-tight truncate">
                {c.value}
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                {c.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
