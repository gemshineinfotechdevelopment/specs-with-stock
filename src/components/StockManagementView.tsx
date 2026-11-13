import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Boxes,
  X,
  Check,
  Glasses,
  ArrowUpDown,
  Eye,
  Edit3,
  Trash2,
  DollarSign,
  Tag,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Product, EyewearCategory, StoreSettings } from '../types';
import { generateNextSequentialSku } from './ProductsView';
import { ProductImage } from './ProductImage';

interface StockManagementViewProps {
  products: Product[];
  settings: StoreSettings;
  onAdjustStock?: (productId: string, delta: number) => void;
  onSetStock?: (productId: string, stock: number) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const CATEGORIES: EyewearCategory[] = [
  'Sunglasses',
  'Cooling Glasses',
  'Power Glasses',
  'Lenses & Care',
];

export const StockManagementView: React.FC<StockManagementViewProps> = ({
  products,
  settings,
  onAdjustStock,
  onSetStock,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EyewearCategory | 'All'>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'stock_asc' | 'stock_desc' | 'name' | 'sku'>('stock_asc');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form Fields
  const [sku, setSku] = useState('');
  const [skuError, setSkuError] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<EyewearCategory>('Power Glasses');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');

  // Power values
  const [rightSph, setRightSph] = useState('');
  const [rightCyl, setRightCyl] = useState('');
  const [rightAxis, setRightAxis] = useState('');
  const [rightAdd, setRightAdd] = useState('');
  const [leftSph, setLeftSph] = useState('');
  const [leftCyl, setLeftCyl] = useState('');
  const [leftAxis, setLeftAxis] = useState('');
  const [leftAdd, setLeftAdd] = useState('');

  const lowStockThreshold = settings.defaultLowStockThreshold || 5;

  const fmt = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  // Metrics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);
  const totalInventoryCost = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.stock || 0), 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

        let matchesStock = true;
        if (stockStatusFilter === 'in_stock') {
          matchesStock = p.stock > lowStockThreshold;
        } else if (stockStatusFilter === 'low_stock') {
          matchesStock = p.stock > 0 && p.stock <= lowStockThreshold;
        } else if (stockStatusFilter === 'out_of_stock') {
          matchesStock = p.stock <= 0;
        }

        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.lensFeature.toLowerCase().includes(q) ||
          p.frameMaterial.toLowerCase().includes(q);

        return matchesCategory && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'stock_asc') return a.stock - b.stock;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'sku') return a.sku.localeCompare(b.sku);
        return 0;
      });
  }, [products, categoryFilter, stockStatusFilter, search, sortBy, lowStockThreshold]);

  // Open Add Product Modal
  const openAddModal = () => {
    setEditingProduct(null);
    setSku(generateNextSequentialSku(products));
    setSkuError('');
    setName('');
    setBrand('');
    setCategory(categoryFilter !== 'All' ? categoryFilter : 'Power Glasses');
    setIsCategoryDropdownOpen(false);
    setPrice('');
    setStock('10');
    setRightSph('');
    setRightCyl('');
    setRightAxis('');
    setRightAdd('');
    setLeftSph('');
    setLeftCyl('');
    setLeftAxis('');
    setLeftAdd('');
    setIsFormModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setSkuError('');
    setName(product.name);
    setBrand(product.brand);
    setCategory(product.category);
    setIsCategoryDropdownOpen(false);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setRightSph(product.rightEyePower?.sph || '');
    setRightCyl(product.rightEyePower?.cyl || '');
    setRightAxis(product.rightEyePower?.axis || '');
    setRightAdd(product.rightEyePower?.add || '');
    setLeftSph(product.leftEyePower?.sph || '');
    setLeftCyl(product.leftEyePower?.cyl || '');
    setLeftAxis(product.leftEyePower?.axis || '');
    setLeftAdd(product.leftEyePower?.add || '');
    setIsFormModalOpen(true);
  };

  // Save (Add or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const isPowerGlasses = category === 'Power Glasses';
    const hasPowerValues = Boolean(
      rightSph.trim() ||
      rightCyl.trim() ||
      rightAxis.trim() ||
      rightAdd.trim() ||
      leftSph.trim() ||
      leftCyl.trim() ||
      leftAxis.trim() ||
      leftAdd.trim()
    );

    const defaultHsn =
      settings.defaultHsnCode || (category === 'Power Glasses' ? '90031100' : '90041000');
    const defaultGst = Number(settings.defaultGstRate) || 12;
    const defaultAlert = Number(settings.defaultLowStockThreshold) || 5;

    const payload: Omit<Product, 'id'> = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      brand: brand.trim() || 'House Brand',
      category,
      frameMaterial: editingProduct?.frameMaterial || 'Standard',
      frameShape: editingProduct?.frameShape || 'Standard',
      lensFeature:
        editingProduct?.lensFeature ||
        (isPowerGlasses ? 'Single Vision Anti-Glare' : 'Polarized UV400'),
      price: Math.max(0, Number(price) || 0),
      costPrice: editingProduct?.costPrice || 0,
      gstRate: defaultGst,
      stock: Math.max(0, Number(stock) || 0),
      reorderLevel: defaultAlert,
      hsnCode: defaultHsn,
      imageUrl: editingProduct?.imageUrl || '',
      isUserAdded: true,
      ...(isPowerGlasses && hasPowerValues
        ? {
            rightEyePower: {
              sph: rightSph.trim() || '0.00',
              cyl: rightCyl.trim() || '0.00',
              axis: rightAxis.trim() || '180',
              add: rightAdd.trim() || '+0.00',
            },
            leftEyePower: {
              sph: leftSph.trim() || '0.00',
              cyl: leftCyl.trim() || '0.00',
              axis: leftAxis.trim() || '180',
              add: leftAdd.trim() || '+0.00',
            },
          }
        : {}),
    };

    if (editingProduct) {
      onUpdateProduct({ ...payload, id: editingProduct.id });
    } else {
      onAddProduct(payload);
    }
    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
      if (viewingProduct?.id === productToDelete.id) {
        setViewingProduct(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-sm">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Stock Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Real-time stock monitoring, inventory management, and product catalog synchronization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total SKUs</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalProducts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unique eyewear models</div>
        </div>

        {/* Total Stock In Store */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Units</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono">{totalStockUnits}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total physical items</div>
        </div>

        {/* Low Stock Items */}
        <div
          onClick={() => setStockStatusFilter('low_stock')}
          className={`border rounded-xl p-4 shadow-xs cursor-pointer transition-all ${
            stockStatusFilter === 'low_stock'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">{lowStockProducts.length}</div>
          <div className="text-[11px] text-amber-600/80 mt-1">≤ {lowStockThreshold} units alert</div>
        </div>

        {/* Out of Stock Items */}
        <div
          onClick={() => setStockStatusFilter('out_of_stock')}
          className={`border rounded-xl p-4 shadow-xs cursor-pointer transition-all ${
            stockStatusFilter === 'out_of_stock'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono">{outOfStockProducts.length}</div>
          <div className="text-[11px] text-rose-600/80 mt-1">Requires immediate refill</div>
        </div>

        {/* Inventory Valuation */}
        <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono truncate" title={fmt(totalInventoryCost)}>
            {fmt(totalInventoryCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={`Retail: ${fmt(totalRetailValuation)}`}>
            Retail: {fmt(totalRetailValuation)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by SKU, name, brand, material, lens feature..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-slate-900"
            >
              <option value="stock_asc">Lowest Stock First</option>
              <option value="stock_desc">Highest Stock First</option>
              <option value="name">Product Name (A-Z)</option>
              <option value="sku">SKU Code</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Sunglasses', 'Cooling Glasses', 'Power Glasses', 'Lenses & Care'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                stockStatusFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Status ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('low_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'low_stock'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Low Stock ({lowStockProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('out_of_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3 h-3" />
              Out of Stock ({outOfStockProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('in_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'in_stock'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              In Stock
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-800">
            Showing {filteredProducts.length} of {products.length} Products
          </span>
          <span className="text-[11px] text-slate-500">
            Click &quot;Edit&quot; to update stock or product specifications.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4">Category & Material</th>
                <th className="py-3 px-4 text-right">Price / Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                    <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    No matching products found. Click &quot;Add Product&quot; to register new inventory.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isCritical = product.stock > 0 && product.stock <= lowStockThreshold;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Product & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <ProductImage category={product.category} className="w-10 h-10 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{product.name}</span>
                              {product.isUserAdded && (
                                <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-slate-700">{product.sku}</span>
                              <span>·</span>
                              <span>{product.brand}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Material */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{product.category}</div>
                        <div className="text-xs text-slate-500">
                          {product.frameMaterial} · {product.frameShape}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={product.lensFeature}>
                          {product.lensFeature}
                        </div>
                      </td>

                      {/* Price / Cost */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-semibold text-slate-900">{fmt(product.price)}</div>
                        <div className="text-xs text-slate-400">Cost: {fmt(product.costPrice)}</div>
                        <div className="text-[10px] text-slate-400">{product.gstRate}% GST</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            OUT OF STOCK
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            LOW STOCK (≤{lowStockThreshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            IN STOCK
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Reorder alert: ≤{product.reorderLevel || lowStockThreshold}
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <span
                            className={`font-mono font-bold text-base px-2.5 py-0.5 rounded-md border ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isCritical
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-900 border-slate-200'
                            }`}
                          >
                            {product.stock} units
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {isOutOfStock ? '0 remaining' : `${product.stock} available`}
                          </span>
                        </div>
                      </td>

                      {/* Actions: View, Edit, Delete */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewingProduct(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="View Product & Stock Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Edit Details & Stock"
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
                <ProductImage category={viewingProduct.category} className="w-12 h-12 shrink-0" />
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

              {/* Stock & Valuation Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Current Stock</div>
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
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Inventory Value</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    {fmt(viewingProduct.costPrice * viewingProduct.stock)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Retail: {fmt(viewingProduct.price * viewingProduct.stock)}
                  </div>
                </div>
              </div>

              {/* Pricing & GST Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] font-medium text-slate-500">Selling Price</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {fmt(viewingProduct.price)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] font-medium text-slate-500">Cost Price</div>
                  <div className="text-base font-bold font-mono text-slate-600 mt-0.5">
                    {fmt(viewingProduct.costPrice)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] font-medium text-slate-500">GST / HSN</div>
                  <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                    {viewingProduct.gstRate}% GST
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {viewingProduct.hsnCode}
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

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-100/70 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setProductToDelete(viewingProduct);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
              >
                Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingProduct;
                    setViewingProduct(null);
                    openEditModal(prod);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Edit Product & Stock
                </button>
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 overflow-y-auto overflow-x-hidden">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg sm:max-w-xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                {editingProduct ? (
                  <Edit3 className="w-5 h-5 text-amber-400" />
                ) : (
                  <Boxes className="w-5 h-5 text-amber-400" />
                )}
                <h2 className="text-base font-semibold truncate">
                  {editingProduct ? 'Edit Eyewear Product & Stock' : 'Add New Product to Inventory'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
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
                    aria-haspopup="listbox"
                    aria-expanded={isCategoryDropdownOpen}
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
                      {/* Fixed full-screen transparent click catcher */}
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
                    <span className="text-[10px] text-slate-400 font-mono">Editable</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSku(val);
                      const isConflict = products.some(
                        (p) => p.sku.toUpperCase() === val.trim() && (!editingProduct || p.id !== editingProduct.id)
                      );
                      if (isConflict) {
                        setSkuError(`SKU "${val.trim()}" is already assigned to another model`);
                      } else {
                        setSkuError('');
                      }
                    }}
                    placeholder="e.g. OPT-101, RB-3025"
                    className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg font-mono font-semibold focus:outline-none focus:bg-white focus:border-slate-900 ${
                      skuError ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200'
                    }`}
                  />
                  {skuError && <p className="text-[11px] text-rose-600 mt-1 font-mono">{skuError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aviator Classic, Matte Black Frame"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Ray-Ban, Fastrack, House Brand"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Selling Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1800"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stock Level (Units) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Power Glasses Prescription Fields */}
              {category === 'Power Glasses' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 w-full min-w-0">
                  <div className="text-xs font-semibold text-slate-800">
                    Optional Default Prescription Powers (for Pre-configured Power Glasses)
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-700 mb-1.5 font-mono">Right Eye (OD)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">SPH</span>
                        <input
                          type="text"
                          value={rightSph}
                          onChange={(e) => setRightSph(e.target.value)}
                          placeholder="-1.25"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">CYL</span>
                        <input
                          type="text"
                          value={rightCyl}
                          onChange={(e) => setRightCyl(e.target.value)}
                          placeholder="-0.50"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">AXIS</span>
                        <input
                          type="text"
                          value={rightAxis}
                          onChange={(e) => setRightAxis(e.target.value)}
                          placeholder="180"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">ADD</span>
                        <input
                          type="text"
                          value={rightAdd}
                          onChange={(e) => setRightAdd(e.target.value)}
                          placeholder="+1.50"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-700 mb-1.5 font-mono">Left Eye (OS)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">SPH</span>
                        <input
                          type="text"
                          value={leftSph}
                          onChange={(e) => setLeftSph(e.target.value)}
                          placeholder="-1.00"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">CYL</span>
                        <input
                          type="text"
                          value={leftCyl}
                          onChange={(e) => setLeftCyl(e.target.value)}
                          placeholder="-0.50"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">AXIS</span>
                        <input
                          type="text"
                          value={leftAxis}
                          onChange={(e) => setLeftAxis(e.target.value)}
                          placeholder="175"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono">ADD</span>
                        <input
                          type="text"
                          value={leftAdd}
                          onChange={(e) => setLeftAdd(e.target.value)}
                          placeholder="+1.50"
                          className="w-full min-w-0 px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(skuError)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {editingProduct ? 'Update Product & Stock' : 'Add to Catalog & Stock'}
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
                <p className="text-xs text-slate-500">This action will remove the product from inventory.</p>
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
