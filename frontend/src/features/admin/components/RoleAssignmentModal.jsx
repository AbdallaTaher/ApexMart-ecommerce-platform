import { useState, useEffect } from 'react';
import {
  HiXMark,
  HiShieldCheck,
  HiBuildingStorefront,
  HiUser,
  HiCheck,
  HiExclamationTriangle,
} from 'react-icons/hi2';

/**
 * Clean Modal for assigning RBAC roles to users
 * Immune to virtualizer stacking context and table clipping
 *
 * @param {Object} props
 * @param {Object} props.user - Target user object
 * @param {boolean} [props.isUpdating=false]
 * @param {Function} props.onClose - Dismiss modal
 * @param {Function} props.onConfirm - Submit new role (role: string) => void
 */
export default function RoleAssignmentModal({
  user,
  isUpdating = false,
  onClose,
  onConfirm,
}) {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'user');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isUpdating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isUpdating]);

  if (!user) return null;

  const isCurrentRole = selectedRole === user.role;

  const roles = [
    {
      id: 'user',
      title: 'Buyer / Retail Customer',
      badge: 'user',
      icon: HiUser,
      description:
        'Standard retail customer. Can browse catalog, place orders, write verified buyer reviews, and track shipments.',
      badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20',
    },
    {
      id: 'seller',
      title: 'Merchant Seller Partner',
      badge: 'seller',
      icon: HiBuildingStorefront,
      description:
        'Store partner. Access to Seller Central Portal, listing management, inventory stock controls, and store revenue analytics.',
      badgeStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
      activeBorder: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20',
    },
    {
      id: 'admin',
      title: 'Platform Administrator',
      badge: 'admin',
      icon: HiShieldCheck,
      description:
        'Tier 0 Root Governance. Executive GMV metrics, RBAC user promotion, and full tamper-proof audit trail inspection.',
      badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUpdating) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-amber/20 text-brand-dark dark:text-amber-400 flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Assign RBAC Role for {user.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isUpdating}
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Currently Assigned Role:</span>
            <span className="font-bold uppercase tracking-wider text-gray-900 dark:text-white px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
              {user.role}
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Select Target Role
            </label>

            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              const isUserCurrent = user.role === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => !isUpdating && setSelectedRole(r.id)}
                  className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? r.activeBorder
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          isSelected
                            ? 'bg-brand-amber text-brand-dark'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {r.title}
                          </span>
                          {isUserCurrent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              Current Role
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          {r.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 mt-1 flex-shrink-0">
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-brand-amber flex items-center justify-center text-brand-dark">
                          <HiCheck className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedRole === 'admin' && user.role !== 'admin' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <HiExclamationTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Elevated Privilege Warning:</strong> Granting Administrator privileges allows
                this user full platform access including GMV financials, audit trails, and user management.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isUpdating}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isUpdating || isCurrentRole}
            onClick={() => onConfirm(selectedRole)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-amber hover:bg-amber-400 text-brand-dark shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isUpdating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                <span>Saving Role...</span>
              </>
            ) : isCurrentRole ? (
              <span>Already Assigned</span>
            ) : (
              <span>Confirm & Apply Role</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
