import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HiChartBar, HiArrowTrendingUp } from 'react-icons/hi2';

/**
 * Custom Tooltip Component for Sales Trajectory Chart
 */
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-brand-darkcard p-3 rounded-lg border border-gray-200 dark:border-brand-darkborder shadow-xl text-xs space-y-1 font-sans">
        <p className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1">
          {label}
        </p>
        <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between gap-4">
          <span>Revenue:</span>
          <span>${Number(data.revenue || 0).toFixed(2)}</span>
        </p>
        <p className="text-blue-600 dark:text-blue-400 font-medium flex items-center justify-between gap-4">
          <span>Units Sold:</span>
          <span>{data.unitsSold || 0}</span>
        </p>
        <p className="text-gray-500 dark:text-gray-400 flex items-center justify-between gap-4">
          <span>Orders:</span>
          <span>{data.orders || 0}</span>
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Seller Sales Performance & Revenue Trajectory Chart
 * @param {Object} props
 * @param {Array} props.data - Array of { date, revenue, unitsSold, orders }
 * @param {boolean} [props.isLoading=false]
 */
export default function SellerSalesChart({ data = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder p-6 shadow-sm space-y-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-64 w-full bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Format data dates if needed
  const chartData = (data || []).map((item) => ({
    ...item,
    formattedDate: item.date ? item.date.slice(5) : '', // 'MM-DD'
  }));

  const totalPeriodRevenue = chartData.reduce(
    (acc, curr) => acc + (curr.revenue || 0),
    0
  );

  return (
    <div className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder p-6 shadow-sm space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-brand-darkborder/70 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-brand-amber">
              <HiArrowTrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold font-display text-gray-950 dark:text-white">
              Revenue & Sales Trajectory
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Daily order volume and net earnings performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-gray-400 block uppercase tracking-wider">
              Period Gross
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-display">
              ${totalPeriodRevenue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Render or Empty State */}
      {chartData.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mx-auto flex items-center justify-center">
            <HiChartBar className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            No sales records yet
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Once customers purchase items from your catalog, your revenue velocity and daily trajectory will appear here.
          </p>
        </div>
      ) : (
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff9900" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ff9900" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-800"
              />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ff9900"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
