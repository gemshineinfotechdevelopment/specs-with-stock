// Generate order-wise, sequential and strictly non-repeating SKU code
export const generateNextSequentialSku = (existingProducts: Product[]): string => {
  const existingSkus = new Set(existingProducts.map((p) => p.sku.trim().toUpperCase()));
  const optNums = existingProducts
    .map((p) => {
      const match = p.sku.match(/^OPT-(\d+)$/i);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null);

  // Continue sequentially from max existing OPT- number, or start from 101
  let nextNum = optNums.length > 0 ? Math.max(...optNums) + 1 : 101;
  while (existingSkus.has(`OPT-${nextNum}`)) {
    nextNum++;
  }
  return `OPT-${nextNum}`;
};

import React, { useState, useMemo } from 'react';
import { Search, Eye, X, Glasses } from 'lucide-react';
import { Product, EyewearCategory, StoreSettings } from '../types';

interface ProductsViewProps {
  products: Product[];
  settings: StoreSettings;
  onAddProduct?: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onAdjustStock?: (productId: string, delta: number) => void;
  initialFilter?: 'all' | 'low';
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  settings,
  initialFilter = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EyewearCategory | 'All'>('All');
  const [stockFilter] = useState<'all' | 'low'>(initialFilter);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesLow = stockFilter === 'all' || p.stock <= (settings.defaultLowStockThreshold || 5);
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.lensFeature.toLowerCase().includes(q);
      return matchesCat && matchesLow && matchesQuery;
    });
  }, [products, categoryFilter, stockFilter, search, settings.defaultLowStockThreshold]);

  const lowStockThreshold = settings.defaultLowStockThreshold || 5;
  const isProductLowStock = (p: Product) => p.stock <= lowStockThreshold;

  const fmt = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="space-y-6">
      {/* Header (No Add Button - Products are added exclusively via Stock Management) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Eyewear Catalog & Products
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Displaying sunglasses, cooling glasses, power frames, and optical lenses synced from inventory
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, model name, brand, or lens feature..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                'All',
                'Sunglasses',
                'Cooling Glasses',
                'Power Glasses',
                'Lenses & Care',
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-Density Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-4">Product / SKU</th>
                <th className="py-3.5 px-4">Category & Material</th>
                <th className="py-3.5 px-4">Lens Specification</th>
                <th className="py-3.5 px-4 text-right">Retail Price</th>
                <th className="py-3.5 px-4 text-right">GST / HSN</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-xs">
                    <Glasses className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No eyewear products found in catalog. Add new products in Stock Management.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isCritical = isProductLowStock(product);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                            <Glasses className="w-5 h-5 stroke-[1.5]" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{product.name}</span>
                              {isOutOfStock ? (
                                <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  OUT OF STOCK
                                </span>
                              ) : isCritical ? (
                                <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  REORDER (≤{lowStockThreshold})
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {product.sku} · {product.brand}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{product.category}</div>
                        <div className="text-xs text-slate-500">
                          {product.frameMaterial} · {product.frameShape}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {product.lensFeature}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-semibold text-slate-900">{fmt(product.price)}</div>
                        <div className="text-xs text-slate-400">Cost: {fmt(product.costPrice)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                        <div>{product.gstRate}% GST</div>
                        <div className="text-slate-400">HSN {product.hsnCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-bold border ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isCritical
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-500'
                                  : isCritical
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            {product.stock} units
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {isOutOfStock
                              ? 'Out of Stock'
                              : isCritical
                              ? `Alert: ≤${lowStockThreshold} units`
                              : 'In Stock'}
                          </span>
                        </div>
                      </td>
                      {/* View Action Only (No edit/delete in Product page) */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingProduct(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          title="View Eyewear Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Product Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl my-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold">
                  Product & Stock Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Product Header Card */}
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <Glasses className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base truncate">{viewingProduct.name}</h3>
                    {viewingProduct.isUserAdded && (
                      <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: <span className="font-bold text-slate-800">{viewingProduct.sku}</span> · Brand: <span className="font-medium text-slate-700">{viewingProduct.brand}</span>
                  </div>
                </div>
              </div>

              {/* Stock & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Stock Level</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1 flex items-center gap-2">
                    <span>{viewingProduct.stock} units</span>
                    {viewingProduct.stock <= 0 ? (
                      <span className="text-[10px] font-sans font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Out of Stock
                      </span>
                    ) : viewingProduct.stock <= lowStockThreshold ? (
                      <span className="text-[10px] font-sans font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Low Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-sans font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        In Stock
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Reorder Alert: ≤{viewingProduct.reorderLevel || lowStockThreshold} units
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Pricing</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {fmt(viewingProduct.price)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Cost: {fmt(viewingProduct.costPrice)}
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Eyewear Specifications
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Category:</span>{' '}
                    <span className="font-semibold text-slate-800">{viewingProduct.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Material:</span>{' '}
                    <span className="font-semibold text-slate-800">{viewingProduct.frameMaterial || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Shape:</span>{' '}
                    <span className="font-semibold text-slate-800">{viewingProduct.frameShape || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lens Feature:</span>{' '}
                    <span className="font-semibold text-slate-800">{viewingProduct.lensFeature || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">GST Rate:</span>{' '}
                    <span className="font-semibold text-slate-800 font-mono">{viewingProduct.gstRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">HSN Code:</span>{' '}
                    <span className="font-semibold text-slate-800 font-mono">{viewingProduct.hsnCode}</span>
                  </div>
                </div>
              </div>

              {/* Prescription Power Details if Power Glasses */}
              {viewingProduct.category === 'Power Glasses' && (viewingProduct.rightEyePower || viewingProduct.leftEyePower) && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Configured Optical Power
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">Right Eye (OD)</div>
                      <div>SPH: {viewingProduct.rightEyePower?.sph || '0.00'}</div>
                      <div>CYL: {viewingProduct.rightEyePower?.cyl || '0.00'}</div>
                      <div>AXIS: {viewingProduct.rightEyePower?.axis || '180'}°</div>
                      <div>ADD: {viewingProduct.rightEyePower?.add || '+0.00'}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">Left Eye (OS)</div>
                      <div>SPH: {viewingProduct.leftEyePower?.sph || '0.00'}</div>
                      <div>CYL: {viewingProduct.leftEyePower?.cyl || '0.00'}</div>
                      <div>AXIS: {viewingProduct.leftEyePower?.axis || '180'}°</div>
                      <div>ADD: {viewingProduct.leftEyePower?.add || '+0.00'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600">
                To edit product specifications, update stock levels, or delete models, please visit the <strong>Stock Management</strong> page.
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-100/70 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
