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
import { Search, Eye, X, Glasses, Edit3, Trash2, Check, ChevronDown } from 'lucide-react';
import { Product, EyewearCategory, StoreSettings } from '../types';

const CATEGORIES: EyewearCategory[] = [
  'Sunglasses',
  'Cooling Glasses',
  'Power Glasses',
  'Lenses & Care',
];

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
  onUpdateProduct,
  onDeleteProduct,
  initialFilter = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EyewearCategory | 'All'>('All');
  const [stockFilter] = useState<'all' | 'low'>(initialFilter);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Edit & Delete modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [skuError, setSkuError] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<EyewearCategory>('Sunglasses');
  const [frameMaterial, setFrameMaterial] = useState('Standard');
  const [frameShape, setFrameShape] = useState('Standard');
  const [lensFeature, setLensFeature] = useState('Polarized UV400');
  const [price, setPrice] = useState<number | string>('');
  const [costPrice, setCostPrice] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>('');
  const [gstRate, setGstRate] = useState<number>(12);
  const [hsnCode, setHsnCode] = useState('90031100');
  const [reorderLevel, setReorderLevel] = useState<number>(5);

  // Optical Power state for Power Glasses
  const [rightSph, setRightSph] = useState('0.00');
  const [rightCyl, setRightCyl] = useState('0.00');
  const [rightAxis, setRightAxis] = useState('180');
  const [rightAdd, setRightAdd] = useState('+0.00');
  const [leftSph, setLeftSph] = useState('0.00');
  const [leftCyl, setLeftCyl] = useState('0.00');
  const [leftAxis, setLeftAxis] = useState('180');
  const [leftAdd, setLeftAdd] = useState('+0.00');

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setSkuError('');
    setBrand(product.brand || '');
    setCategory(product.category);
    setFrameMaterial(product.frameMaterial || 'Standard');
    setFrameShape(product.frameShape || 'Standard');
    setLensFeature(product.lensFeature || 'Standard');
    setPrice(product.price);
    setCostPrice(product.costPrice || '');
    setStock(product.stock);
    setGstRate(product.gstRate || 12);
    setHsnCode(product.hsnCode || '90031100');
    setReorderLevel(product.reorderLevel || 5);

    if (product.rightEyePower) {
      setRightSph(product.rightEyePower.sph || '0.00');
      setRightCyl(product.rightEyePower.cyl || '0.00');
      setRightAxis(String(product.rightEyePower.axis ?? '180'));
      setRightAdd(product.rightEyePower.add || '+0.00');
    } else {
      setRightSph('0.00');
      setRightCyl('0.00');
      setRightAxis('180');
      setRightAdd('+0.00');
    }

    if (product.leftEyePower) {
      setLeftSph(product.leftEyePower.sph || '0.00');
      setLeftCyl(product.leftEyePower.cyl || '0.00');
      setLeftAxis(String(product.leftEyePower.axis ?? '180'));
      setLeftAdd(product.leftEyePower.add || '+0.00');
    } else {
      setLeftSph('0.00');
      setLeftCyl('0.00');
      setLeftAxis('180');
      setLeftAdd('+0.00');
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const trimmedSku = sku.trim().toUpperCase();
    if (!trimmedSku) {
      setSkuError('SKU code is required');
      return;
    }

    const isConflict = products.some(
      (p) => p.sku.toUpperCase() === trimmedSku && p.id !== editingProduct.id
    );
    if (isConflict) {
      setSkuError(`SKU "${trimmedSku}" is already assigned to another model`);
      return;
    }

    const isPower = category === 'Power Glasses';
    const updatedProd: Product = {
      ...editingProduct,
      name: name.trim(),
      sku: trimmedSku,
      brand: brand.trim() || 'House Brand',
      category,
      frameMaterial: frameMaterial.trim() || 'Standard',
      frameShape: frameShape.trim() || 'Standard',
      lensFeature: lensFeature.trim() || (isPower ? 'Single Vision Anti-Glare' : 'Polarized UV400'),
      price: Math.max(0, Number(price) || 0),
      costPrice: Math.max(0, Number(costPrice) || 0),
      stock: Math.max(0, Number(stock) || 0),
      gstRate: Number(gstRate) || 12,
      hsnCode: hsnCode.trim() || '90031100',
      reorderLevel: Number(reorderLevel) || 5,
      isUserAdded: true,
      ...(isPower
        ? {
            rightEyePower: {
              sph: rightSph.trim(),
              cyl: rightCyl.trim(),
              axis: rightAxis.trim() || '180',
              add: rightAdd.trim(),
            },
            leftEyePower: {
              sph: leftSph.trim(),
              cyl: leftCyl.trim(),
              axis: leftAxis.trim() || '180',
              add: leftAdd.trim(),
            },
          }
        : {}),
    };

    onUpdateProduct?.(updatedProd);
    setEditingProduct(null);
    if (viewingProduct?.id === editingProduct.id) {
      setViewingProduct(updatedProd);
    }
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct?.(productToDelete.id);
      setProductToDelete(null);
      if (viewingProduct?.id === productToDelete.id) {
        setViewingProduct(null);
      }
    }
  };

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
                <th className="py-3.5 px-4 text-right">Retail Price</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
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
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-semibold text-slate-900">{fmt(product.price)}</div>
                        {product.costPrice > 0 && (
                          <div className="text-xs text-slate-400">Cost: {fmt(product.costPrice)}</div>
                        )}
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
                      {/* Actions: View, Edit, Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewingProduct(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="View Eyewear Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
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
            </div>

            <div className="px-5 py-3.5 bg-slate-100/70 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingProduct;
                    setViewingProduct(null);
                    openEditModal(prod);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingProduct;
                    setViewingProduct(null);
                    setProductToDelete(prod);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 overflow-y-auto overflow-x-hidden">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg sm:max-w-xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold truncate">
                  Edit Eyewear Product
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="min-w-0 relative">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg font-medium text-slate-800 flex items-center justify-between focus:outline-none focus:bg-white focus:border-slate-900 transition-colors cursor-pointer text-left"
                  >
                    <span className="truncate">{category}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isCategoryDropdownOpen ? 'rotate-180 text-slate-900' : ''
                      }`}
                    />
                  </button>

                  {isCategoryDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-100 py-1">
                        {CATEGORIES.map((cat) => {
                          const isSelected = category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setCategory(cat);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50 text-amber-950 font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span>{cat}</span>
                              {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      SKU Code *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Unique</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSku(val);
                      const isConflict = products.some(
                        (p) => p.sku.toUpperCase() === val.trim() && p.id !== editingProduct?.id
                      );
                      if (isConflict) {
                        setSkuError(`SKU "${val.trim()}" is already assigned to another model`);
                      } else {
                        setSkuError('');
                      }
                    }}
                    placeholder="e.g. OPT-101"
                    className={`w-full px-3 py-2 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                      skuError
                        ? 'border-rose-300 focus:border-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:border-slate-900'
                    }`}
                  />
                  {skuError && <p className="text-[11px] text-rose-600 mt-1 font-medium">{skuError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Product / Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aviator Classic Gold"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Ray-Ban, Fastrack"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Specs: Frame Material, Shape, Lens Feature */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Frame Material
                  </label>
                  <input
                    type="text"
                    value={frameMaterial}
                    onChange={(e) => setFrameMaterial(e.target.value)}
                    placeholder="e.g. Titanium, TR90"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Frame Shape
                  </label>
                  <input
                    type="text"
                    value={frameShape}
                    onChange={(e) => setFrameShape(e.target.value)}
                    placeholder="e.g. Rectangle, Round"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lens Feature
                  </label>
                  <input
                    type="text"
                    value={lensFeature}
                    onChange={(e) => setLensFeature(e.target.value)}
                    placeholder="e.g. Polarized UV400"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Power Glasses Diopters if category is Power Glasses */}
              {category === 'Power Glasses' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-xs font-semibold text-slate-800">
                    Standard Prescribed Powers (OD / OS)
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">Right Eye (OD)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500">SPH</span>
                          <input
                            type="text"
                            value={rightSph}
                            onChange={(e) => setRightSph(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">CYL</span>
                          <input
                            type="text"
                            value={rightCyl}
                            onChange={(e) => setRightCyl(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500">AXIS</span>
                          <input
                            type="text"
                            value={rightAxis}
                            onChange={(e) => setRightAxis(e.target.value)}
                            placeholder="180"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">ADD</span>
                          <input
                            type="text"
                            value={rightAdd}
                            onChange={(e) => setRightAdd(e.target.value)}
                            placeholder="+0.00"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">Left Eye (OS)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500">SPH</span>
                          <input
                            type="text"
                            value={leftSph}
                            onChange={(e) => setLeftSph(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">CYL</span>
                          <input
                            type="text"
                            value={leftCyl}
                            onChange={(e) => setLeftCyl(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500">AXIS</span>
                          <input
                            type="text"
                            value={leftAxis}
                            onChange={(e) => setLeftAxis(e.target.value)}
                            placeholder="180"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">ADD</span>
                          <input
                            type="text"
                            value={leftAdd}
                            onChange={(e) => setLeftAdd(e.target.value)}
                            placeholder="+0.00"
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Retail Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cost Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Tax & Reorder Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="90031100"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value) || 5)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(skuError)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Product</h3>
                <p className="text-xs text-slate-500">This action will remove the product from catalog and inventory.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              Are you sure you want to delete <strong className="text-slate-900">{productToDelete.name}</strong> (SKU: <span className="font-mono font-bold text-slate-800">{productToDelete.sku}</span>)?
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
