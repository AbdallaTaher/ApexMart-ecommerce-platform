import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../features/auth/hooks/useUser';
import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading } = useUser();

  // If already logged in, redirect to home
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-brand-slate py-8 px-4 flex flex-col justify-between items-center font-sans">
      {/* Top Brand Logo */}
      <div className="w-full max-w-sm flex flex-col items-center mb-4">
        <Link to="/" className="flex items-center gap-2 mb-4 group">
          <div className="w-9 h-9 rounded-lg bg-brand-amber flex items-center justify-center text-slate-950 font-black text-2xl font-display shadow-sm group-hover:scale-105 transition-transform">
            A
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
            Apex<span className="text-brand-amber">Mart</span>
          </span>
        </Link>

        {/* Forgot Password Card */}
        <ForgotPasswordForm />
      </div>

      {/* Auth Footer */}
      <footer className="w-full max-w-sm border-t border-gray-300 dark:border-brand-darkborder pt-6 mt-8 text-center text-[11px] text-gray-500 dark:text-gray-400 space-y-2">
        <div className="flex justify-center gap-6">
          <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer">
            Conditions of Use
          </span>
          <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer">
            Privacy Notice
          </span>
          <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer">
            Help
          </span>
        </div>
        <p>© 1996–2026, ApexMart.com, Inc. or its affiliates</p>
      </footer>
    </main>
  );
}
