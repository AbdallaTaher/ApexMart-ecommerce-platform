import { useState, useEffect } from 'react';
import {
  HiShieldCheck,
  HiChartBar,
  HiUsers,
  HiClock,
  HiArrowPath,
} from 'react-icons/hi2';
import { usePlatformAnalytics } from '../features/admin/hooks/usePlatformAnalytics';
import { useAdminUsers } from '../features/admin/hooks/useAdminUsers';
import { useAuditLogs } from '../features/admin/hooks/useAuditLogs';
import AdminKpiMetrics from '../features/admin/components/AdminKpiMetrics';
import AdminRevenueTrajectoryChart from '../features/admin/components/AdminRevenueTrajectoryChart';
import AdminUserManagementTable from '../features/admin/components/AdminUserManagementTable';
import AdminAuditTrailViewer from '../features/admin/components/AdminAuditTrailViewer';

/**
 * Platform Admin Governance Console Page (Slice 9 - Task 33)
 */
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'audit'

  const {
    analytics,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
    isFetching: isAnalyticsFetching,
  } = usePlatformAnalytics();

  const {
    users,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
    isFetching: isUsersFetching,
  } = useAdminUsers();

  const {
    auditLogs,
    isLoading: isAuditLoading,
    refetch: refetchAudit,
    isFetching: isAuditFetching,
  } = useAuditLogs();

  useEffect(() => {
    document.title = 'Platform Admin Governance & Executive Console | ApexMart';
  }, []);

  const handleRefreshAll = () => {
    refetchAnalytics();
    refetchUsers();
    refetchAudit();
  };

  const isGlobalRefreshing = isAnalyticsFetching || isUsersFetching || isAuditFetching;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header & Platform Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-brand-dark text-white shadow-xl relative overflow-hidden border border-gray-800">
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-amber/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase">
              <HiShieldCheck className="w-4 h-4" />
              <span>Platform Tier 0 Governance Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Executive Administration & Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Real-time monitoring of Gross Merchandise Value (GMV), RBAC role governance,
              tamper-proof compliance logs, and platform catalog health.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/80 text-xs text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Live • ACME Compliant</span>
            </div>

            <button
              type="button"
              disabled={isGlobalRefreshing}
              onClick={handleRefreshAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-amber text-brand-dark text-xs font-bold hover:bg-amber-400 shadow-md transition disabled:opacity-50"
            >
              <HiArrowPath className={`w-4 h-4 ${isGlobalRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <div className="flex space-x-2 sm:space-x-4">
            {[
              { id: 'analytics', label: 'Executive Analytics & GMV', icon: HiChartBar },
              { id: 'users', label: 'User & RBAC Governance', icon: HiUsers },
              { id: 'audit', label: 'Security & Audit Trail', icon: HiClock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'border-brand-amber text-brand-amber'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Executive Analytics & GMV */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* KPI Metric Cards */}
            <AdminKpiMetrics
              financials={analytics?.financials}
              users={analytics?.users}
              catalog={analytics?.catalog}
              isLoading={isAnalyticsLoading}
            />

            {/* 30-Day Sales Trajectory Chart */}
            <AdminRevenueTrajectoryChart
              trajectory={analytics?.trajectory || []}
              isLoading={isAnalyticsLoading}
            />

            {/* Two Column Grid: Top Products & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Selling Products */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Top Selling Products Platform-Wide
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">Ranked by Revenue</span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {analytics?.topProducts?.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      No order sales records accumulated yet
                    </div>
                  ) : (
                    analytics?.topProducts?.map((prod, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prod.imageCover || '/placeholder.png'}
                            alt={prod.title}
                            className="w-10 h-10 object-contain rounded-lg bg-gray-50 dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-700 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {prod.title}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {prod.unitsSold} units sold • ${prod.price?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ${prod.revenue?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Recent Platform Orders
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">Live Feed</span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {analytics?.recentOrders?.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      No customer checkout transactions yet
                    </div>
                  ) : (
                    analytics?.recentOrders?.map((ord) => (
                      <div key={ord._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>#{ord._id.slice(-6).toUpperCase()}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                ord.orderStatus === 'delivered'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : ord.orderStatus === 'cancelled'
                                  ? 'bg-rose-500/10 text-rose-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              {ord.orderStatus.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Customer: {ord.user?.email || ord.user?.name || 'Guest'}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-gray-900 dark:text-white">
                            ${ord.totalPrice?.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User & RBAC Governance */}
        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-200">
            <AdminUserManagementTable
              users={users}
              isLoading={isUsersLoading}
              onRefresh={refetchUsers}
            />
          </div>
        )}

        {/* Tab 3: Security & Audit Trail */}
        {activeTab === 'audit' && (
          <div className="animate-in fade-in duration-200">
            <AdminAuditTrailViewer
              auditLogs={auditLogs}
              isLoading={isAuditLoading}
              onRefresh={refetchAudit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
