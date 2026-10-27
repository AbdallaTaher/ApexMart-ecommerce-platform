import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  HiMagnifyingGlass,
  HiShieldCheck,
  HiBuildingStorefront,
  HiUser,
  HiArrowPath,
} from 'react-icons/hi2';
import { useUser } from '../../auth/hooks/useUser';
import { useUpdateUserRole } from '../hooks/useUpdateUserRole';
import RoleAssignmentModal from './RoleAssignmentModal';

/**
 * Virtualized RBAC User Governance Table keeping DOM elements strictly <800 nodes
 *
 * @param {Object} props
 * @param {Array} props.users - List of user records
 * @param {boolean} [props.isLoading=false]
 * @param {Function} [props.onRefresh]
 */
export default function AdminUserManagementTable({
  users = [],
  isLoading = false,
  onRefresh,
}) {
  const { user: currentUser } = useUser();
  const { updateRole, isUpdating } = useUpdateUserRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'user' | 'seller' | 'admin'
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);

  const parentRef = useRef(null);

  // Client-side search and role filter
  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u._id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, roleFilter, searchTerm]);

  // Virtualizer instance: 68px row height
  const rowVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    overscan: 5,
  });

  const currentAdminId = currentUser?._id || currentUser?.id;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          icon: HiShieldCheck,
          className:
            'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30',
        };
      case 'seller':
        return {
          label: 'Merchant Seller',
          icon: HiBuildingStorefront,
          className:
            'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30',
        };
      case 'user':
      default:
        return {
          label: 'Verified Buyer',
          icon: HiUser,
          className:
            'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30',
        };
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            User Accounts & RBAC Governance
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {filteredUsers.length} Users
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage granular access control, promote merchant sellers, and maintain role boundaries
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
              placeholder="Search by name, email..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-amber/40 text-gray-900 dark:text-white"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'user', label: 'Buyers' },
              { id: 'seller', label: 'Sellers' },
              { id: 'admin', label: 'Admins' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roleFilter === tab.id
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
              title="Refresh User List"
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
          <div className="col-span-5 sm:col-span-4">User Details</div>
          <div className="col-span-4 sm:col-span-3">Role & Permissions</div>
          <div className="hidden sm:block sm:col-span-3">Joined Date</div>
          <div className="col-span-3 sm:col-span-2 text-right">RBAC Action</div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-12 px-5 py-4 items-center animate-pulse">
                <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-32 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                <div className="hidden sm:block sm:col-span-3">
                  <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="col-span-3 sm:col-span-2 flex justify-end">
                  <div className="w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <HiUser className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-semibold">No users matching filter criteria</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the search or role tabs</p>
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
                const user = filteredUsers[virtualRow.index];
                const isSelf = currentAdminId && (user._id === currentAdminId || user.id === currentAdminId);
                const roleBadge = getRoleBadge(user.role);
                const BadgeIcon = roleBadge.icon;

                return (
                  <div
                    key={user._id || virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="grid grid-cols-12 px-5 py-3 items-center hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    {/* User Profile */}
                    <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-amber/30 to-amber-500/20 text-brand-dark dark:text-amber-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {user.name ? user.name.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                          {user.name}
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="col-span-4 sm:col-span-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleBadge.className}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {roleBadge.label}
                      </span>
                    </div>

                    {/* Joined Date */}
                    <div className="hidden sm:block sm:col-span-3 text-xs text-gray-500 dark:text-gray-400">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </div>

                    {/* Action Button */}
                    <div className="col-span-3 sm:col-span-2 text-right">
                      {isSelf ? (
                        <span
                          className="text-[11px] font-medium text-gray-400 dark:text-gray-500 italic"
                          title="Administrators cannot demote themselves to prevent lockout"
                        >
                          Protected
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setSelectedUserForRole(user)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-brand-amber hover:text-brand-dark text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm transition"
                        >
                          Change Role
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {selectedUserForRole && (
        <RoleAssignmentModal
          user={selectedUserForRole}
          isUpdating={isUpdating}
          onClose={() => setSelectedUserForRole(null)}
          onConfirm={(targetRole) => {
            updateRole({ userId: selectedUserForRole._id, role: targetRole });
            setSelectedUserForRole(null);
          }}
        />
      )}
    </div>
  );
}
