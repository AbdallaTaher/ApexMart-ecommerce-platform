import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { DarkModeProvider } from './context/DarkModeContext';
import { CartProvider } from './context/CartContext';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ui/ErrorFallback';
import AppLayout from './ui/AppLayout';
import ProtectedRoute from './ui/ProtectedRoute';
import ScrollToTop from './ui/ScrollToTop';

import HomePage from './pages/HomePage';

// Route-level code splitting for non-root routes
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const PageNotFound = lazy(() => import('./pages/PageNotFound'));

// Initializing React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-brand-amber rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-sans">
        Loading ApexMart...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => window.location.replace('/')}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public Storefront Routes with Main Layout */}
                  <Route element={<AppLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="catalog" element={<CatalogPage />} />
                    <Route path="products/:slug" element={<ProductDetailPage />} />
                    <Route path="product/:slug" element={<ProductDetailPage />} />
                    <Route path="cart" element={<CartPage />} />
                  </Route>

                  {/* Protected User Account, Orders & Checkout Routes (Guard wraps AppLayout to prevent layout bounce) */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="account" element={<AccountPage />} />
                      <Route path="checkout" element={<CheckoutPage />} />
                      <Route path="order-success/:id" element={<OrderSuccessPage />} />
                      <Route path="orders" element={<OrdersPage />} />
                    </Route>
                  </Route>

                  {/* Protected Seller Central Routes (RBAC Restricted to Seller and Admin) */}
                  <Route element={<ProtectedRoute allowedRoles={['seller', 'admin']} />}>
                    <Route element={<AppLayout />}>
                      <Route path="seller/dashboard" element={<SellerDashboardPage />} />
                    </Route>
                  </Route>
                  <Route
                    path="seller"
                    element={<Navigate to="/seller/dashboard" replace />}
                  />

                  {/* Protected Admin Governance Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route element={<AppLayout />}>
                      <Route path="admin/dashboard" element={<AdminDashboardPage />} />
                    </Route>
                  </Route>
                  <Route
                    path="admin"
                    element={<Navigate to="/admin/dashboard" replace />}
                  />

                {/* Standalone Clean Authentication Routes */}
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password/:token" element={<ResetPasswordPage />} />

                {/* Catch-all 404 Route */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </CartProvider>

        {/* Global Toast Notifications Container */}
        <Toaster
          position="top-center"
          gutter={12}
          containerStyle={{ margin: '8px' }}
          toastOptions={{
            success: {
              duration: 3000,
            },
            error: {
              duration: 4000,
            },
            style: {
              fontSize: '14px',
              maxWidth: '500px',
              padding: '12px 16px',
              backgroundColor: 'var(--color-brand-darkcard, #ffffff)',
              color: 'var(--color-text-primary, #111827)',
              border: '1px solid var(--color-brand-darkborder, #e5e7eb)',
              borderRadius: '8px',
              fontWeight: 500,
            },
          }}
        />
      </DarkModeProvider>
    </QueryClientProvider>
  );
}
