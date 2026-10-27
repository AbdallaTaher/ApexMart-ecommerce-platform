import { useState } from 'react';
import {
  HiBuildingStorefront,
  HiPlus,
  HiArrowPath,
  HiShoppingBag,
  HiFire,
} from 'react-icons/hi2';

import { useUser } from '../features/auth/hooks/useUser';
import { useSellerAnalytics } from '../features/seller/hooks/useSellerAnalytics';
import { useSellerProducts } from '../features/seller/hooks/useSellerProducts';
import { useCreateProduct } from '../features/seller/hooks/useCreateProduct';
import { useUpdateProduct } from '../features/seller/hooks/useUpdateProduct';
import { useDeleteProduct } from '../features/seller/hooks/useDeleteProduct';

import SellerKpiCards from '../features/seller/components/SellerKpiCards';
import SellerSalesChart from '../features/seller/components/SellerSalesChart';
import SellerInventoryTable from '../features/seller/components/SellerInventoryTable';
import ProductFormModal from '../features/seller/components/ProductFormModal';
import DeleteProductConfirmModal from '../features/seller/components/DeleteProductConfirmModal';

/**
 * Seller Central Dashboard & Store Management Portal
 */
export default function SellerDashboardPage() {
  const { user } = useUser();
  const { analytics, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } =
    useSellerAnalytics();
  const { products, isLoading: isProductsLoading, refetch: refetchProducts } =
    useSellerProducts({ limit: 100 });

  const { createProduct, isCreating } = useCreateProduct();
  const { updateProduct, isUpdating } = useUpdateProduct();
  const { deleteProduct, isDeleting } = useDeleteProduct();

  // Modal Dialog States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const handleOpenCreateModal = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setProductToEdit(null);
  };

  const handleFormSubmit = (productData) => {
    if (productToEdit?._id) {
      updateProduct(
        { id: productToEdit._id, productData },
        {
          onSuccess: () => handleCloseFormModal(),
        }
      );
    } else {
      createProduct(productData, {
        onSuccess: () => handleCloseFormModal(),
      });
    }
  };

  const handleDeleteConfirm = (productId) => {
    deleteProduct(productId, {
      onSuccess: () => setProductToDelete(null),
    });
  };

  const handleRefreshAll = () => {
    refetchAnalytics();
    refetchProducts();
  };

  const topProducts = analytics?.topProducts || [];
  const recentOrders = analytics?.recentOrders || [];

  return (
    <div className="space-y-8 pb-12">
      {/* 1) Page Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-brand-darkborder pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-amber/15 text-brand-hover">
              <HiBuildingStorefront className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-gray-950 dark:text-white tracking-tight">
              Merchant Central
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Welcome back, <strong className="text-gray-800 dark:text-gray-200">{user?.name}</strong> • Store Management & Live Analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefreshAll}
            title="Refresh Store Data"
            className="p-2 rounded-lg border border-gray-200 dark:border-brand-darkborder bg-white dark:bg-brand-darkcard text-gray-600 dark:text-gray-300 hover:text-brand-amber hover:border-brand-amber transition shadow-xs text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <HiArrowPath className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-amber hover:bg-brand-hover text-slate-950 font-bold text-xs shadow-sm transition"
          >
            <HiPlus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2) Top High-Level KPI Summary Cards */}
      <section aria-label="Store KPIs">
        <SellerKpiCards
          metrics={analytics?.metrics}
          isLoading={isAnalyticsLoading}
        />
      </section>

      {/* 3) Sales Trajectory Chart & Mini Insights Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SellerSalesChart
            data={analytics?.salesTrajectory}
            isLoading={isAnalyticsLoading}
          />
        </div>

        {/* Top Products & Order Stream Widget */}
        <div className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-brand-darkborder/70 pb-3">
              <h3 className="text-sm font-bold font-display text-gray-950 dark:text-white flex items-center gap-1.5">
                <HiFire className="w-4 h-4 text-red-500" />
                <span>Top Performing Items</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-gray-400">
                Ranked by sales
              </span>
            </div>

            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No orders recorded yet. Top revenue drivers will rank here.
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.productId || idx}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={p.imageCover || 'default-product.jpg'}
                        alt={p.name}
                        className="w-8 h-8 rounded object-contain border border-gray-200 dark:border-gray-800 flex-shrink-0"
                      />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-gray-900 dark:text-white">
                        ${Number(p.revenue || 0).toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {p.unitsSold} sold
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-brand-darkbg/50 border border-gray-100 dark:border-brand-darkborder flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <HiShoppingBag className="w-4 h-4 text-brand-amber" />
              <span>Recent Checkouts:</span>
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {recentOrders.length} orders
            </span>
          </div>
        </div>
      </section>

      {/* 4) Virtualized Seller Products Inventory Table */}
      <section aria-label="Inventory Table">
        <SellerInventoryTable
          products={products}
          isLoading={isProductsLoading}
          onAddProduct={handleOpenCreateModal}
          onEditProduct={handleOpenEditModal}
          onDeleteProduct={(product) => setProductToDelete(product)}
        />
      </section>

      {/* 5) Create / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        productToEdit={productToEdit}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {/* 6) Delete Confirmation Dialog Modal */}
      <DeleteProductConfirmModal
        isOpen={Boolean(productToDelete)}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
