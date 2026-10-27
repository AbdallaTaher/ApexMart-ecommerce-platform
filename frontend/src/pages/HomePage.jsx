import { Link } from 'react-router-dom';
import {
  HiSparkles,
  HiTruck,
  HiShieldCheck,
  HiArrowPath,
  HiStar,
} from 'react-icons/hi2';
import Button from '../ui/Button';
import DealsScroller from '../features/products/components/DealsScroller';

export default function HomePage() {
  const categories = [
    {
      title: 'Trending Electronics',
      link: '/catalog?categorySlug=electronics',
      tagline: 'Smartphones, Audio & Wearables',
      badge: 'Up to 40% Off',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&fm=webp',
    },
    {
      title: 'Computers & Workstations',
      link: '/catalog?search=laptop',
      tagline: 'Laptops, Monitors & Accessories',
      badge: 'Prime Deal',
      image:
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60&fm=webp',
    },
    {
      title: 'Modern Fashion & Apparel',
      link: '/catalog?categorySlug=fashion-and-apparel',
      tagline: 'Footwear, Watches & Styles',
      badge: 'New Arrivals',
      image:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&fm=webp',
    },
    {
      title: 'Home & Kitchen Essentials',
      link: '/catalog?categorySlug=home-and-kitchen',
      tagline: 'Decor, Kitchen & Smart Living',
      badge: 'Best Sellers',
      image:
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60&fm=webp',
    },
  ];

  return (
    <div className="space-y-10">
      {/* 1) Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navylight to-[#1e293b] text-white p-8 sm:p-12 shadow-xl border border-gray-700/50">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-amber/20 border border-brand-amber/40 text-brand-amber text-xs font-bold uppercase tracking-wider">
            <HiSparkles className="w-4 h-4" />
            Prime Summer Marketplace
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight">
            Discover Millions of Products with <span className="text-brand-amber">Fast Delivery</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Welcome to ApexMart — your all-in-one destination for verified seller deals,
            next-generation tech, and seamless checkout.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/catalog">
              <Button size="lg" className="font-display">
                Explore Prime Catalog
              </Button>
            </Link>
            <Link to="/seller/dashboard">
              <Button variant="secondary" size="lg">
                Become a Seller
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-amber/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2) Value Proposition Highlights */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-brand-amber flex-shrink-0">
            <HiTruck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">Free & Fast Shipping</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">On Prime eligible orders</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-green-500/10 text-green-500 flex-shrink-0">
            <HiShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">100% Secure Checkout</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Powered by Stripe SSL</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
            <HiArrowPath className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">30-Day Easy Returns</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Hassle-free guarantee</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500 flex-shrink-0">
            <HiStar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">Verified Reviews</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Authentic buyer feedback</p>
          </div>
        </div>
      </section>

      {/* 2.5) Live Top Deals Scroller */}
      <DealsScroller
        title="Today's Flash Deals"
        subtitle="Save big with verified seller deals & Prime fast shipping"
      />

      {/* 3) Featured Department Cards Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 dark:text-white">
            Shop by Department
          </h2>
          <Link
            to="/catalog?isDeal=true"
            className="text-xs sm:text-sm font-semibold text-brand-hover hover:underline"
          >
            See all deals &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to={cat.link}
              className="group bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200 dark:border-brand-darkborder overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-amber dark:hover:border-brand-amber transition-all flex flex-col cursor-pointer"
            >
              <div className="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={cat.image}
                  alt={cat.title}
                  width="400"
                  height="250"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand-amber text-slate-950 shadow">
                  {cat.badge}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-brand-hover transition">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {cat.tagline}
                  </p>
                </div>

                <span className="text-xs font-bold text-brand-hover group-hover:underline inline-flex items-center gap-1">
                  Shop Now &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
