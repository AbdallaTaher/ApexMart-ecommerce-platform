import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../features/auth/hooks/useUser';
import { useLogout } from '../features/auth/hooks/useLogout';
import {
  HiUser,
  HiEnvelope,
  HiShieldCheck,
  HiShoppingBag,
  HiBuildingStorefront,
  HiArrowRightOnRectangle,
  HiKey,
} from 'react-icons/hi2';
import Button from '../ui/Button';
import UpdateProfileForm from '../features/auth/components/UpdateProfileForm';
import UpdatePasswordForm from '../features/auth/components/UpdatePasswordForm';

export default function AccountPage() {
  const { user } = useUser();
  const { logout, isPending } = useLogout();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  if (!user) return null;

  const roleBadgeStyles = {
    user: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    seller: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    admin: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 font-display">
            Your Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal profile, security credentials, and preferences.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          isLoading={isPending}
          disabled={isPending}
          className="self-start sm:self-auto text-red-600 dark:text-red-400 border border-gray-300 dark:border-brand-darkborder"
        >
          <HiArrowRightOnRectangle className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>

      {/* Account Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div
          onClick={() => setActiveTab('profile')}
          className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between cursor-pointer transition ${
            activeTab === 'profile'
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-brand-amber dark:border-brand-amber/60'
              : 'bg-white dark:bg-[#1a1f29] border-gray-200 dark:border-brand-darkborder hover:border-gray-300'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-brand-amber mb-4">
              <HiUser className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
              Personal Information
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Edit name and verified email.
            </p>
          </div>

          <div className="space-y-2 text-xs border-t border-gray-100 dark:border-brand-darkborder pt-3">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 truncate">
              <HiUser className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-semibold truncate">{user.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 truncate">
              <HiEnvelope className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Security / Password Card */}
        <div
          onClick={() => setActiveTab('security')}
          className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between cursor-pointer transition ${
            activeTab === 'security'
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-brand-amber dark:border-brand-amber/60'
              : 'bg-white dark:bg-[#1a1f29] border-gray-200 dark:border-brand-darkborder hover:border-gray-300'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <HiKey className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
              Login & Security
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Change account password and credentials.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline border-t border-gray-100 dark:border-brand-darkborder pt-3 block">
            Update Password →
          </span>
        </div>

        {/* Orders Card */}
        <Link
          to="/orders"
          className="bg-white dark:bg-[#1a1f29] p-6 rounded-xl border border-gray-200 dark:border-brand-darkborder shadow-sm flex flex-col justify-between hover:border-brand-amber transition group cursor-pointer"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition">
              <HiShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-brand-amber transition">
              Your Orders
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Track packages, view receipts, and buy again.
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-amber group-hover:underline border-t border-gray-100 dark:border-brand-darkborder pt-3 block">
            View Order History & Tracking &rarr;
          </span>
        </Link>
      </div>

      {/* Interactive Settings Editor Section */}
      <div className="mb-8">
        {activeTab === 'profile' ? <UpdateProfileForm /> : <UpdatePasswordForm />}
      </div>

      {/* Account Details Panel */}
      <div className="bg-white dark:bg-[#1a1f29] p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-brand-darkborder shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 font-display">
          Account Governance & Credentials
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#151b24] border border-gray-200/60 dark:border-brand-darkborder">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Account ID
            </span>
            <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate block mt-1">
              {user._id}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#151b24] border border-gray-200/60 dark:border-brand-darkborder">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Assigned Tier
            </span>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-md border uppercase tracking-wider ${
                roleBadgeStyles[user.role] || roleBadgeStyles.user
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#151b24] border border-gray-200/60 dark:border-brand-darkborder">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Session Security
            </span>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <HiShieldCheck className="w-4 h-4" />
              <span>HttpOnly JWT Verified</span>
            </span>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#151b24] border border-gray-200/60 dark:border-brand-darkborder">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Seller Status
            </span>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1 mt-1">
              <HiBuildingStorefront className="w-4 h-4 text-brand-amber" />
              <span>{user.role === 'seller' ? 'Active Merchant' : 'Not Enrolled'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
