import { Outlet, Link } from 'react-router-dom';
import Header from './Header';
import SubHeader from './SubHeader';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-brand-slate text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* 1) Top Promotional / Prime Announcement Bar */}
      <aside className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 text-xs font-semibold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-950 text-amber-400">
          PRIME SPECIAL
        </span>
        <span className="hidden sm:inline">
          Save up to 50% on trending tech and essentials. Free delivery on orders over $35!
        </span>
        <span className="sm:hidden">Fast & Free Shipping on Prime Orders!</span>
        <Link
          to="/catalog"
          className="underline font-bold text-slate-950 hover:text-white transition ml-1"
        >
          Shop Now &rarr;
        </Link>
      </aside>

      {/* 2) Main Header */}
      <Header />

      {/* 3) Secondary Navigation SubHeader */}
      <SubHeader />

      {/* 4) Dynamic Main Content View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* 5) Comprehensive Footer */}
      <Footer />
    </div>
  );
}
