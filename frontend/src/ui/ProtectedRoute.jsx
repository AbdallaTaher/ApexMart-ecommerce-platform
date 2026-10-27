import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useUser } from '../features/auth/hooks/useUser';
import Spinner from './Spinner';

/**
 * Route Guard Component protecting private buyer/seller/admin views
 *
 * @param {Array<string>} [allowedRoles] - Optional list of authorized roles (e.g. ['admin', 'seller'])
 * @param {React.ReactNode} [children] - Wrapped component or fallback to <Outlet />
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isLoading, isAuthenticated, user } = useUser();
  const location = useLocation();

  const hasAuthHint =
    typeof window !== 'undefined' &&
    localStorage.getItem('apex_auth_hint') === 'true';

  // 1) Fast-bail: If user has no active session hint and is not authenticated, immediately redirect to /login
  if (!hasAuthHint && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2) While session is actively being verified from HttpOnly cookie
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-brand-slate flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-sans">
          Verifying secure session...
        </p>
      </div>
    );
  }

  // 3) If verification completed and user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 4) If roles are specified and user role is not authorized
  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-[#1a1f29] rounded-xl shadow-md border border-gray-200 dark:border-brand-darkborder text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 text-xl font-bold">
          ✕
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 font-display">
          Access Restricted
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          You do not have administrative permissions ({allowedRoles.join(', ')}) to access this portal.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  // 5) Access granted
  return children ? children : <Outlet />;
}
