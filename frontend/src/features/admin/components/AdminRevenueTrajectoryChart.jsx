import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * 30-Day Platform GMV & Order Volume Trajectory Curve
 *
 * @param {Object} props
 * @param {Array} props.trajectory - Array of daily sales records { date, gmv, orderCount, unitsSold }
 * @param {boolean} [props.isLoading=false]
 */
export default function AdminRevenueTrajectoryChart({ trajectory = [], isLoading = false }) {
  const [metricView, setMetricView] = useState('all'); // 'all' | 'gmv' | 'orders'

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-gray-900/95 text-white rounded-xl shadow-xl border border-gray-700/80 backdrop-blur-md text-xs">
          <div className="font-semibold text-gray-300 mb-2 border-b border-gray-700 pb-1">
            Date: {data.date}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-400 font-medium">Platform GMV:</span>
              <span className="font-bold">{formatCurrency(data.gmv)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-purple-400 font-medium">Orders Count:</span>
              <span className="font-bold">{data.orderCount || 0} orders</span>
            </div>
            {data.unitsSold !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-blue-400 font-medium">Units Sold:</span>
                <span className="font-bold">{data.unitsSold || 0} items</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-44 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="w-full h-72 bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            30-Day Platform Sales & Volume Trajectory
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Live Aggregate
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Continuous daily performance monitoring across all active orders and merchants
          </p>
        </div>

        {/* Metric Mode Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMetricView('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              metricView === 'all'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Metrics
          </button>
          <button
            type="button"
            onClick={() => setMetricView('gmv')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              metricView === 'gmv'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            GMV ($)
          </button>
          <button
            type="button"
            onClick={() => setMetricView('orders')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              metricView === 'orders'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700/60"
            />

            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              stroke="#9ca3af"
            />

            <YAxis
              yAxisId="left"
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              stroke="#9ca3af"
              hide={metricView === 'orders'}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${v}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              stroke="#9ca3af"
              hide={metricView === 'gmv'}
            />

            <Tooltip content={<CustomTooltip />} />

            {(metricView === 'all' || metricView === 'gmv') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="gmv"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gmvGradient)"
                name="GMV ($)"
              />
            )}

            {(metricView === 'all' || metricView === 'orders') && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="orderCount"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#orderGradient)"
                name="Orders"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-end gap-6 mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
        {(metricView === 'all' || metricView === 'gmv') && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Gross Merchandise Value (GMV $)</span>
          </div>
        )}
        {(metricView === 'all' || metricView === 'orders') && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Order Volume (Count)</span>
          </div>
        )}
      </div>
    </div>
  );
}
