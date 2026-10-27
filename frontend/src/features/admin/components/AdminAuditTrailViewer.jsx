import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  HiMagnifyingGlass,
  HiShieldCheck,
  HiExclamationTriangle,
  HiInformationCircle,
  HiXMark,
  HiCodeBracket,
  HiArrowPath,
} from 'react-icons/hi2';

/**
 * Virtualized Immutable Audit Trail Viewer keeping DOM nodes < 800
 *
 * @param {Object} props
 * @param {Array} props.auditLogs - Array of audit log records
 * @param {boolean} [props.isLoading=false]
 * @param {Function} [props.onRefresh]
 */
export default function AdminAuditTrailViewer({
  auditLogs = [],
  isLoading = false,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const [inspectingLog, setInspectingLog] = useState(null);

  const parentRef = useRef(null);

  const filteredLogs = useMemo(() => {
    let list = [...auditLogs];

    if (severityFilter !== 'all') {
      list = list.filter((l) => l.severity === severityFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.action?.toLowerCase().includes(q) ||
          l.entity?.toLowerCase().includes(q) ||
          l.entityId?.toLowerCase().includes(q) ||
          l.ipAddress?.toLowerCase().includes(q) ||
          l.user?.email?.toLowerCase().includes(q) ||
          l.user?.name?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [auditLogs, severityFilter, searchTerm]);

  // Virtualizer: 64px row height
  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: HiExclamationTriangle,
          label: 'CRITICAL',
          className:
            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30',
        };
      case 'warning':
        return {
          icon: HiExclamationTriangle,
          label: 'WARNING',
          className:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
        };
      case 'info':
      default:
        return {
          icon: HiInformationCircle,
          label: 'INFO',
          className:
            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
        };
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Immutable Audit Trail & Compliance Log
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              SOC2 / OWASP Tamper-Proof
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cryptographically sealed events, privilege modifications, and system transactions
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative min-w-[220px]">
            <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search action, entity, user..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-amber/40 text-gray-900 dark:text-white"
            />
          </div>

          {/* Severity Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Severities' },
              { id: 'critical', label: 'Critical' },
              { id: 'warning', label: 'Warning' },
              { id: 'info', label: 'Info' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  severityFilter === tab.id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
              title="Refresh Audit Logs"
            >
              <HiArrowPath className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Virtualized Table Container */}
      <div className="border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden bg-white dark:bg-gray-900/40">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 dark:bg-gray-800/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700/60">
          <div className="col-span-3 sm:col-span-2">Severity & Timestamp</div>
          <div className="col-span-4 sm:col-span-3">Action Identifier</div>
          <div className="col-span-3 sm:col-span-3">Entity & Target</div>
          <div className="hidden sm:block sm:col-span-2">Actor (User)</div>
          <div className="col-span-2 sm:col-span-2 text-right">Payload</div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-12 px-5 py-4 items-center animate-pulse">
                <div className="col-span-3 sm:col-span-2 space-y-1.5">
                  <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="col-span-3 sm:col-span-3">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="hidden sm:block sm:col-span-2">
                  <div className="w-24 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="col-span-2 sm:col-span-2 flex justify-end">
                  <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <HiShieldCheck className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-semibold">No audit records found matching criteria</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the severity tabs or search filter</p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="overflow-auto max-h-[520px] divide-y divide-gray-100 dark:divide-gray-800"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const log = filteredLogs[virtualRow.index];
                const badge = getSeverityBadge(log.severity);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={log._id || virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="grid grid-cols-12 px-5 py-2.5 items-center hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors text-xs"
                  >
                    {/* Severity & Time */}
                    <div className="col-span-3 sm:col-span-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-4 sm:col-span-3 font-mono font-semibold text-gray-900 dark:text-white truncate pr-2">
                      {log.action}
                    </div>

                    {/* Entity & ID */}
                    <div className="col-span-3 sm:col-span-3 truncate text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {log.entity}
                      </span>
                      {log.entityId && (
                        <span className="text-[11px] text-gray-400 ml-1.5 font-mono">
                          #{log.entityId.slice(-6)}
                        </span>
                      )}
                    </div>

                    {/* Actor */}
                    <div className="hidden sm:block sm:col-span-2 truncate text-gray-500 dark:text-gray-400">
                      {log.user?.email || log.user?.name || (
                        <span className="italic text-gray-400">System / Webhook</span>
                      )}
                    </div>

                    {/* Inspect Button */}
                    <div className="col-span-2 sm:col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-brand-amber hover:text-brand-dark text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition"
                      >
                        <HiCodeBracket className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Audit Payload JSON Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <HiShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Audit Log Payload Inspection
                  </h4>
                  <p className="text-xs text-gray-400 font-mono">
                    ID: {inspectingLog._id} • Action: {inspectingLog.action}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="text-gray-400 font-medium">Actor</div>
                  <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
                    {inspectingLog.user?.name || 'System / Service'} ({inspectingLog.user?.email || 'N/A'})
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="text-gray-400 font-medium">Client IP & Origin</div>
                  <div className="font-semibold text-gray-900 dark:text-white mt-0.5 font-mono">
                    {inspectingLog.ipAddress || '127.0.0.1'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-400 font-medium mb-1.5">User Agent</div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-gray-600 dark:text-gray-300 break-all">
                  {inspectingLog.userAgent || 'Unknown'}
                </div>
              </div>

              <div>
                <div className="text-gray-400 font-medium mb-1.5">
                  Sanitized Details Payload (Module 06 Redaction Guard)
                </div>
                <pre className="p-4 rounded-xl bg-gray-950 text-emerald-400 border border-gray-800 font-mono text-xs overflow-x-auto max-h-64">
                  {JSON.stringify(inspectingLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
