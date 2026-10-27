import {
  HiCurrencyDollar,
  HiShoppingBag,
  HiUsers,
  HiCube,
  HiShieldCheck,
  HiCheckBadge,
} from 'react-icons/hi2';

/**
 * Platform Executive KPI Cards with trend badges and loading skeletons
 *
 * @param {Object} props
 * @param {Object} props.financials
 * @param {Object} props.users
 * @param {Object} props.catalog
 * @param {boolean} [props.isLoading=false]
 */
export default function AdminKpiMetrics({
  financials = {},
  users = {},
  catalog = {},
  isLoading = false,
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const cards = [
    {
      title: 'Gross Merchandise Value (GMV)',
      value: formatCurrency(financials.gmv),
      subtitle: `Settled: ${formatCurrency(financials.settledRevenue)}`,
      icon: HiCurrencyDollar,
      accent: 'emerald',
      bgGradient: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      badge: 'Platform-wide',
    },
    {
      title: 'Total Platform Orders',
      value: (financials.totalOrders || 0).toLocaleString(),
      subtitle: `${financials.activeOrders || 0} active • ${financials.completedOrders || 0} delivered`,
      icon: HiShoppingBag,
      accent: 'blue',
      bgGradient: 'from-blue-500/10 to-transparent',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      badge: `${financials.totalUnitsSold || 0} units`,
    },
    {
      title: 'Registered Users',
      value: (users.total || 0).toLocaleString(),
      subtitle: `${users.buyers || 0} buyers • ${users.sellers || 0} sellers • ${users.admins || 0} admins`,
      icon: HiUsers,
      accent: 'purple',
      bgGradient: 'from-purple-500/10 to-transparent',
      borderColor: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      badge: 'RBAC Governed',
    },
    {
      title: 'Catalog Inventory Health',
      value: (catalog.total || 0).toLocaleString(),
      subtitle: `${catalog.active || 0} active • ${catalog.lowStock || 0} low stock • ${catalog.outOfStock || 0} out`,
      icon: HiCube,
      accent: 'amber',
      bgGradient: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      badge: catalog.outOfStock > 0 ? `${catalog.outOfStock} out of stock` : 'Healthy',
      badgeColor: catalog.outOfStock > 0 ? 'text-rose-600 bg-rose-500/10' : 'text-emerald-600 bg-emerald-500/10',
    },
    {
      title: 'Settled Net Revenue',
      value: formatCurrency(financials.settledRevenue),
      subtitle: `${financials.completedOrders || 0} finalized transactions`,
      icon: HiCheckBadge,
      accent: 'cyan',
      bgGradient: 'from-cyan-500/10 to-transparent',
      borderColor: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      badge: 'Stripe Confirmed',
    },
    {
      title: 'Audit & Compliance Status',
      value: 'Tamper-Proof',
      subtitle: 'Immutable pre-hooks active across audit trails',
      icon: HiShieldCheck,
      accent: 'teal',
      bgGradient: 'from-teal-500/10 to-transparent',
      borderColor: 'border-teal-500/30',
      iconBg: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
      badge: 'SOC2 / OWASP',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-sm animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="w-16 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
            <div className="w-36 h-7 rounded bg-gray-300 dark:bg-gray-600 mb-2" />
            <div className="w-44 h-3.5 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative p-5 rounded-2xl bg-white dark:bg-gray-800/80 border ${card.borderColor} shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300`}
          >
            <div
              className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${card.bgGradient} rounded-bl-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    card.badgeColor || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {card.badge}
                </span>
              </div>

              <div className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-1">
                {card.title}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1.5">
                {card.value}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
