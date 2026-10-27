import { Link } from 'react-router-dom';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer className="mt-auto bg-brand-navy text-white text-xs">
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="w-full py-3.5 bg-brand-navylight hover:bg-gray-700 text-center font-bold text-gray-200 hover:text-white transition duration-150 block"
      >
        Back to top
      </button>

      {/* Main 4-Column Links Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-sm text-white mb-3 tracking-wide">
            Get to Know Us
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link to="/about" className="hover:underline">
                About ApexMart
              </Link>
            </li>
            <li>
              <Link to="/careers" className="hover:underline">
                Careers & Culture
              </Link>
            </li>
            <li>
              <Link to="/press" className="hover:underline">
                Press Releases
              </Link>
            </li>
            <li>
              <Link to="/science" className="hover:underline">
                ApexMart Science
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-sm text-white mb-3 tracking-wide">
            Make Money with Us
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link to="/seller/dashboard" className="hover:underline text-amber-400">
                Sell products on ApexMart
              </Link>
            </li>
            <li>
              <Link to="/affiliates" className="hover:underline">
                Become an Affiliate
              </Link>
            </li>
            <li>
              <Link to="/advertising" className="hover:underline">
                Advertise Your Products
              </Link>
            </li>
            <li>
              <Link to="/self-publish" className="hover:underline">
                Self-Publish with Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-sm text-white mb-3 tracking-wide">
            Payment & Prime
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link to="/rewards" className="hover:underline">
                ApexMart Rewards Card
              </Link>
            </li>
            <li>
              <Link to="/points" className="hover:underline">
                Shop with Points
              </Link>
            </li>
            <li>
              <Link to="/reload" className="hover:underline">
                Reload Your Balance
              </Link>
            </li>
            <li>
              <Link to="/currency-converter" className="hover:underline">
                Currency Converter
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-sm text-white mb-3 tracking-wide">
            Let Us Help You
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link to="/account" className="hover:underline">
                Your Account
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:underline">
                Your Orders & Tracking
              </Link>
            </li>
            <li>
              <Link to="/shipping" className="hover:underline">
                Shipping Rates & Policies
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:underline">
                Returns & Replacements
              </Link>
            </li>
            <li>
              <Link to="/customer-service" className="hover:underline">
                Help & Support
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700/60 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-amber text-slate-950 font-black flex items-center justify-center font-display text-sm">
              A
            </div>
            <span className="font-display font-bold text-white text-base">
              Apex<span className="text-brand-amber">Mart</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="px-3 py-1 rounded border border-gray-600 bg-brand-navylight text-gray-200">
              🌐 English
            </span>
            <span className="px-3 py-1 rounded border border-gray-600 bg-brand-navylight text-gray-200">
              💵 USD - U.S. Dollar
            </span>
            <span className="px-3 py-1 rounded border border-gray-600 bg-brand-navylight text-gray-200">
              🇺🇸 United States
            </span>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#0b0f14] py-6 text-center text-gray-400 text-[11px]">
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <Link to="/conditions" className="hover:underline">
            Conditions of Use
          </Link>
          <Link to="/privacy" className="hover:underline">
            Privacy Notice
          </Link>
          <Link to="/ads" className="hover:underline">
            Interest-Based Ads
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()}, ApexMart.com, Inc. or its affiliates. All rights reserved.</p>
      </div>
    </footer>
  );
}
