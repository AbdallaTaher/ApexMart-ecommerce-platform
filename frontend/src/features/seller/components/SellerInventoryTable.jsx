import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Link } from 'react-router-dom';
import {
  HiMagnifyingGlass,
  HiPencilSquare,
  HiTrash,
  HiArrowTopRightOnSquare,
  HiPlus,
  HiCube,
} from 'react-icons/hi2';

/**
 * High-performance virtualized seller inventory table keeping DOM elements strictly <800 nodes
 *
 * @param {Object} props
 * @param {Array} props.products - List of products owned by seller
 * @param {boolean} [props.isLoading=false]
 * @param {Function} props.onAddProduct - Callback to open create product modal
 * @param {Function} props.onEditProduct - Callback to open edit product modal
 * @param {Function} props.onDeleteProduct - Callback to open delete confirm modal
 */
export default function SellerInventoryTable({
  products = [],
  isLoading = false,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'rating'

  const parentRef = useRef(null);

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1) Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
      );
    }

    // 2) Stock filter
    if (stockFilter === 'in_stock') {
      result = result.filter((p) => p.stock > 10);
    } else if (stockFilter === 'low_stock') {
      result = result.filter((p) => p.stock > 0 && p.stock <= 10);
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter((p) => p.stock <= 0);
    }

    // 3) Status filter
    if (statusFilter === 'active') {
      result = result.filter((p) => p.isActive !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter((p) => p.isActive === false);
    }

    // 4) Sorting
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'rating') return (b.ratingsAverage || 0) - (a.ratingsAverage || 0);
      // Default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return result;
  }, [products, searchTerm, stockFilter, statusFilter, sortBy]);

  // Virtualizer setup for DOM flattening (<800 DOM nodes constraint)
  const rowVirtualizer = useVirtualizer({
    count: filteredProducts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 6,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Bar with Actions & Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-brand-darkborder/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-display text-gray-950 dark:text-white flex items-center gap-2">
            <span>Store Inventory Catalog</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {filteredProducts.length} items
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage live pricing, stock quantities, and product catalog listings
          </p>
        </div>

        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-amber hover:bg-brand-hover text-slate-950 font-bold text-xs shadow-sm transition self-start md:self-auto"
        >
          <HiPlus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 bg-gray-50/70 dark:bg-brand-darkbg/30 border-b border-gray-100 dark:border-brand-darkborder/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <HiMagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inventory..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-amber"
          />
        </div>

        {/* Stock Status Dropdown */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-amber"
        >
          <option value="all">All Inventory Stocks</option>
          <option value="in_stock">In Stock (&gt; 10)</option>
          <option value="low_stock">Low Stock (1 - 10)</option>
          <option value="out_of_stock">Out of Stock (0)</option>
        </select>

        {/* Visibility Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-amber"
        >
          <option value="all">All Listing Statuses</option>
          <option value="active">Active in Catalog</option>
          <option value="inactive">Draft / Inactive</option>
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brand-darkborder bg-white dark:bg-[#151b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-amber"
        >
          <option value="newest">Recently Added</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="stock_asc">Stock: Lowest First</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Virtualized Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-brand-darkbg/40 border-b border-gray-200/80 dark:border-brand-darkborder">
            <div className="col-span-5">Product Details</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1 text-center">Stock</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="divide-y divide-gray-100 dark:divide-brand-darkborder/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 px-5 py-4 items-center animate-pulse">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                  </div>
                  <div className="col-span-2 h-4 bg-gray-200 dark:bg-gray-800 rounded w-20" />
                  <div className="col-span-2 h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 ml-auto" />
                  <div className="col-span-1 h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-12 mx-auto" />
                  <div className="col-span-1 h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-12 mx-auto" />
                  <div className="col-span-1 h-6 bg-gray-200 dark:bg-gray-800 rounded w-14 ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredProducts.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-brand-amber mx-auto flex items-center justify-center">
                <HiCube className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                No matching inventory items
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No products matched your search or filters. Try resetting search filters or publish a new product.
              </p>
              {(searchTerm || stockFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStockFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs font-bold text-brand-hover hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Virtualized Rows Container */}
          {!isLoading && filteredProducts.length > 0 && (
            <div
              ref={parentRef}
              className="max-h-[520px] overflow-y-auto relative scrollbar-none"
              style={{ height: '520px' }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const product = filteredProducts[virtualRow.index];
                  if (!product) return null;

                  const isLow = product.stock > 0 && product.stock <= 10;
                  const isOut = product.stock <= 0;

                  return (
                    <div
                      key={product._id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center border-b border-gray-100 dark:border-brand-darkborder/50 hover:bg-gray-50/70 dark:hover:bg-brand-darkbg/30 transition text-xs"
                    >
                      {/* Product (Cover + Title + Brand) */}
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <img
                          src={product.imageCover || 'default-product.jpg'}
                          alt={product.name}
                          width="48"
                          height="48"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100';
                          }}
                          className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-gray-800 bg-white flex-shrink-0 p-1"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="truncate">{product.brand || 'ApexMart Standard'}</span>
                            <span>•</span>
                            <span className="text-amber-500 font-semibold">
                              {product.ratingsAverage || '5.0'} ★ ({product.ratingsQuantity || 0})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="col-span-2 text-gray-600 dark:text-gray-300 truncate">
                        {product.category?.name || 'General'}
                      </div>

                      {/* Price & Discount */}
                      <div className="col-span-2 text-right">
                        <span className="font-black text-gray-950 dark:text-white font-display">
                          ${Number(product.price || 0).toFixed(2)}
                        </span>
                        {product.dealDiscountPercentage > 0 && (
                          <span className="block text-[10px] font-bold text-red-600 dark:text-red-400">
                            {product.dealDiscountPercentage}% OFF DEAL
                          </span>
                        )}
                      </div>

                      {/* Stock Status Badge */}
                      <div className="col-span-1 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </div>

                      {/* Listing Visibility Status */}
                      <div className="col-span-1 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            product.isActive !== false
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {product.isActive !== false ? 'Live' : 'Draft'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-1 flex items-center justify-end gap-1.5">
                        <Link
                          to={`/product/${product.slug || product._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Live Listing"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <HiArrowTopRightOnSquare className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onEditProduct(product)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-amber hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                        >
                          <HiPencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
