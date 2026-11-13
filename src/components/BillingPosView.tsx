import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  Eye,
  Check,
  Receipt,
  RotateCcw,
  Glasses,
} from 'lucide-react';
import {
  Product,
  Customer,
  CartItem,
  EyewearCategory,
  OpticalPrescription,
  PaymentMethod,
  OrderStatus,
  SalesInvoice,
  StoreSettings,
} from '../types';

interface BillingPosViewProps {
  products: Product[];
  customers: Customer[];
  invoices?: SalesInvoice[];
  settings: StoreSettings;
  initialCategory?: EyewearCategory | 'All';
  preselectedCustomerId?: string | null;
  onCompleteSale: (
    invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>,
    newCustomer?: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>
  ) => void;
  onNavigateToProducts?: () => void;
}

const LENS_UPGRADE_OPTIONS = [
  { label: 'Standard Included Lens', price: 0 },
  { label: 'Zero-Power Blue Cut 420nm', price: 600 },
  { label: 'Single Vision Anti-Glare + UV', price: 1400 },
  { label: 'Photochromic Day/Night Transition', price: 2200 },
  { label: 'Digital Progressive High-Index 1.67', price: 3200 },
];

const DEFAULT_RX: OpticalPrescription = {
  rightEye: { sph: '-1.00', cyl: '-0.25', axis: '180', add: '+0.00' },
  leftEye: { sph: '-1.25', cyl: '-0.25', axis: '175', add: '+0.00' },
  pd: '63',
  lensType: 'Single Vision Anti-Glare',
  notes: '',
  recordedAt: new Date().toISOString().slice(0, 10),
};

export const BillingPosView: React.FC<BillingPosViewProps> = ({
  products,
  customers,
  invoices,
  settings,
  initialCategory = 'All',
  preselectedCustomerId,
  onCompleteSale,
  onNavigateToProducts,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EyewearCategory | 'All'>(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Customer details (simple Name and Mobile Number inputs, no walk-in switch!)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || ''
  );
  const [customerName, setCustomerName] = useState<string>(() => {
    if (preselectedCustomerId) {
      const cust = customers.find((c) => c.id === preselectedCustomerId);
      if (cust) return cust.name;
    }
    return '';
  });
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    if (preselectedCustomerId) {
      const cust = customers.find((c) => c.id === preselectedCustomerId);
      if (cust) return cust.phone.replace(/\D/g, '').slice(-10);
    }
    return '';
  });

  // POS Page Tabs: 'catalog' (products table) vs 'bill' (the marked counter bill & checkout tab)
  const [posTab, setPosTab] = useState<'catalog' | 'bill'>(() => {
    return preselectedCustomerId ? 'bill' : 'catalog';
  });

  // Check if active customer has a pending eye test order / lab fitting invoice
  const activeLabInvoice = useMemo(() => {
    if (!selectedCustomerId || selectedCustomerId === 'walk-in') return null;
    return (
      invoices?.find(
        (inv) => inv.customerId === selectedCustomerId && inv.orderStatus === 'Lab Fitting'
      ) || null
    );
  }, [invoices, selectedCustomerId]);

  const convertInvoiceItemsToCart = (inv: SalesInvoice): CartItem[] => {
    if (!inv || !inv.items || inv.items.length === 0) return [];
    return inv.items.map((item) => {
      const matchingProd = products.find((p) => p.id === item.productId);
      const prod: Product = matchingProd || {
        id: item.productId || 'rx-lab-lens',
        sku: item.sku || 'RX-LAB',
        name: item.name || 'Rx Lab Order - Prescription Fitting',
        category: (item.category as EyewearCategory) || 'Power Glasses',
        brand: 'House Brand',
        frameMaterial: 'Standard',
        frameShape: 'Standard',
        lensFeature: item.lensUpgradeLabel || 'Prescription Lenses',
        price: item.unitPrice || Math.round(item.lineTotal / (item.quantity || 1)),
        costPrice: 0,
        gstRate: item.gstRate !== undefined ? item.gstRate : (settings.defaultGstRate || 12),
        stock: 999,
        reorderLevel: 0,
        hsnCode: item.hsnCode || '90031100',
        imageUrl: '',
      };
      return {
        product: prod,
        quantity: item.quantity || 1,
        lensUpgradeLabel: item.lensUpgradeLabel || 'Standard Included Lens',
        lensUpgradePrice: item.lensUpgradePrice || 0,
        itemDiscount: item.discount || 0,
      };
    });
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const targetCustId = preselectedCustomerId || customers[0]?.id;
    if (targetCustId && invoices) {
      const labInv = invoices.find(
        (inv) => inv.customerId === targetCustId && inv.orderStatus === 'Lab Fitting'
      );
      if (labInv) {
        return convertInvoiceItemsToCart(labInv);
      }
    }
    return [];
  });

  // Optical Prescription (Rx) toggle & values
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const [attachRx, setAttachRx] = useState<boolean>(() => {
    const targetCustId = preselectedCustomerId || customers[0]?.id;
    const targetCust = customers.find((c) => c.id === targetCustId);
    const labInv = invoices?.find(
      (inv) => inv.customerId === targetCustId && inv.orderStatus === 'Lab Fitting'
    );
    return Boolean(labInv?.prescription || targetCust?.prescription);
  });

  const [rxData, setRxData] = useState<OpticalPrescription>(() => {
    const targetCustId = preselectedCustomerId || customers[0]?.id;
    const targetCust = customers.find((c) => c.id === targetCustId);
    const labInv = invoices?.find(
      (inv) => inv.customerId === targetCustId && inv.orderStatus === 'Lab Fitting'
    );
    return labInv?.prescription || targetCust?.prescription || DEFAULT_RX;
  });

  // Payment & Order Status
  const [extraBillDiscount, setExtraBillDiscount] = useState<number>(0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const targetCustId = preselectedCustomerId || customers[0]?.id;
    const labInv = invoices?.find(
      (inv) => inv.customerId === targetCustId && inv.orderStatus === 'Lab Fitting'
    );
    return labInv?.paymentMethod || 'UPI / QR';
  });

  const [orderStatus, setOrderStatus] = useState<OrderStatus>(() => {
    const targetCustId = preselectedCustomerId || customers[0]?.id;
    const labInv = invoices?.find(
      (inv) => inv.customerId === targetCustId && inv.orderStatus === 'Lab Fitting'
    );
    return labInv?.orderStatus || 'Completed';
  });

  const [advancePaidInput, setAdvancePaidInput] = useState<string>(() => {
    const targetCustId = preselectedCustomerId || customers[0]?.id;
    const labInv = invoices?.find(
      (inv) => inv.customerId === targetCustId && inv.orderStatus === 'Lab Fitting'
    );
    if (labInv && labInv.amountPaid !== undefined) {
      return String(labInv.amountPaid);
    }
    return '';
  });

  const [staffName, setStaffName] = useState<string>('Suresh K.');

  // Sync Rx & Order when customer switches
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone.replace(/\D/g, '').slice(-10));
      if (found.prescription) {
        setRxData(found.prescription);
        setAttachRx(true);
      }
    }
    const labInv = invoices?.find(
      (inv) => inv.customerId === custId && inv.orderStatus === 'Lab Fitting'
    );
    if (labInv && labInv.items && labInv.items.length > 0) {
      setCart(convertInvoiceItemsToCart(labInv));
      setAdvancePaidInput(String(labInv.amountPaid));
      setPaymentMethod(labInv.paymentMethod || 'UPI / QR');
      setOrderStatus(labInv.orderStatus || 'Lab Fitting');
      if (labInv.prescription) {
        setRxData(labInv.prescription);
        setAttachRx(true);
      }
    }
  };

  // Products available in Billing POS directly from Catalog
  const posProducts = useMemo(() => products, [products]);

  const filteredProducts = useMemo(() => {
    return posProducts.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.lensFeature.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [posProducts, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty >= product.stock) return prev;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
        };
        return updated;
      }
      const defaultLens =
        product.category === 'Power Glasses'
          ? LENS_UPGRADE_OPTIONS[2]
          : LENS_UPGRADE_OPTIONS[0];
      return [
        ...prev,
        {
          product,
          quantity: 1,
          lensUpgradeLabel: defaultLens.label,
          lensUpgradePrice: defaultLens.price,
          itemDiscount: 0,
        },
      ];
    });

    if (product.category === 'Power Glasses') {
      setAttachRx(true);
      setOrderStatus('Lab Fitting');
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.product.stock) return item;
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateCartLens = (productId: string, lensLabel: string) => {
    const foundLens =
      LENS_UPGRADE_OPTIONS.find((o) => o.label === lensLabel) || LENS_UPGRADE_OPTIONS[0];
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              lensUpgradeLabel: foundLens.label,
              lensUpgradePrice: foundLens.price,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Financial Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let itemLevelDiscounts = 0;
    let totalGst = 0;

    cart.forEach((item) => {
      if (!item || !item.product) return;
      const unitCombined = item.product.price + item.lensUpgradePrice;
      const grossLine = unitCombined * item.quantity;
      const netLine = Math.max(0, grossLine - item.itemDiscount);
      subtotal += grossLine;
      itemLevelDiscounts += item.itemDiscount;
      totalGst += (netLine * item.product.gstRate) / 100;
    });

    // GST is strictly calculated on products & lenses and does NOT change when Staff Discount is applied
    const totalGstRounded = Math.round(totalGst);
    const cgst = Math.round(totalGstRounded / 2);
    const sgst = totalGstRounded - cgst;

    const totalDiscount = itemLevelDiscounts + extraBillDiscount;

    // Staff Discount is subtracted directly from the Grand Total (Subtotal + GST - Staff Discount)
    const netBeforeStaffDiscount = Math.max(0, subtotal - itemLevelDiscounts) + cgst + sgst;
    const grandTotal = Math.max(0, Math.round(netBeforeStaffDiscount - extraBillDiscount));

    return {
      subtotal,
      itemLevelDiscounts,
      extraBillDiscount,
      totalDiscount,
      cgst,
      sgst,
      grandTotal,
    };
  }, [cart, extraBillDiscount]);

  const parsedAdvance =
    advancePaidInput.trim() === ''
      ? calculations.grandTotal
      : Math.min(calculations.grandTotal, Math.max(0, Number(advancePaidInput) || 0));

  const balanceDue = Math.max(0, calculations.grandTotal - parsedAdvance);

  const fmt = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const finalCustomerName = customerName.trim() || 'Walk-In Customer';
    const cleanDigits = customerPhone.replace(/\D/g, '').slice(0, 10);
    const finalCustomerPhone =
      cleanDigits.length === 10
        ? `+91 ${cleanDigits}`
        : cleanDigits
        ? `+91 ${cleanDigits}`
        : '+91 90000 00000';

    const deliveryDate = new Date(
      Date.now() + settings.defaultLabDays * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);

    const isExisting =
      selectedCustomerId &&
      selectedCustomerId !== 'walk-in' &&
      customers.some((c) => c.id === selectedCustomerId);

    onCompleteSale(
      {
        customerId: isExisting ? selectedCustomerId : `cust-${Date.now()}`,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        items: cart.map((c) => ({
          productId: c.product.id,
          sku: c.product.sku,
          name: c.product.name,
          category: c.product.category,
          hsnCode: c.product.hsnCode,
          quantity: c.quantity,
          unitPrice: c.product.price,
          lensUpgradeLabel: c.lensUpgradeLabel,
          lensUpgradePrice: c.lensUpgradePrice,
          discount: c.itemDiscount,
          gstRate: c.product.gstRate,
          lineTotal:
            (c.product.price + c.lensUpgradePrice) * c.quantity - c.itemDiscount,
        })),
        prescription: attachRx ? rxData : undefined,
        subtotal: calculations.subtotal,
        totalDiscount: calculations.totalDiscount,
        cgstAmount: calculations.cgst,
        sgstAmount: calculations.sgst,
        grandTotal: calculations.grandTotal,
        amountPaid: parsedAdvance,
        balanceDue,
        paymentMethod,
        orderStatus,
        deliveryDate: orderStatus !== 'Completed' ? deliveryDate : undefined,
        staffName,
      },
      !isExisting
        ? {
            name: finalCustomerName,
            phone: finalCustomerPhone,
            email: '',
            prescription: attachRx ? rxData : undefined,
          }
        : undefined
    );

    // Clear cart after billing
    setCart([]);
    setExtraBillDiscount(0);
    setAdvancePaidInput('');
  };

  const categories: (EyewearCategory | 'All')[] = [
    'All',
    'Sunglasses',
    'Cooling Glasses',
    'Power Glasses',
    'Lenses & Care',
  ];

  return (
    <div className="space-y-4">
      {/* Top POS Navigation Tabs: Product Catalog vs Active Counter Bill & Checkout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold select-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPosTab('catalog')}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              posTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Glasses className="w-4 h-4 text-slate-700" />
            <span>Product Catalog</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
              {filteredProducts.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPosTab('bill')}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              posTab === 'bill'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Active Counter Bill</span>
            {cart.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-400 text-slate-950 font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)} · {fmt(calculations.grandTotal)}
              </span>
            )}
          </button>
        </div>

        {/* Quick jump CTA */}
        {posTab === 'catalog' && cart.length > 0 && (
          <button
            type="button"
            onClick={() => setPosTab('bill')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <span>Proceed to Bill ({cart.reduce((s, i) => s + i.quantity, 0)} items · {fmt(calculations.grandTotal)})</span>
            <span>→</span>
          </button>
        )}
        {posTab === 'bill' && (
          <button
            type="button"
            onClick={() => setPosTab('catalog')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <span>← Add More Products from Catalog</span>
          </button>
        )}
      </div>

      {/* TAB 1: FULL-WIDTH PRODUCT CATALOG */}
      {posTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Category Segmented Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode, SKU (e.g. SUN-AV-901), frame brand, or lens feature..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
              />
            </div>

            {/* Interactive Filter Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'All' ? 'All Eyewear' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Eyewear Table */}
          {posProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Glasses className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                No Products in Catalog
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Only products added in the Product page appear in Billing POS. Please add eyewear models from the Product Catalog.
              </p>
              {onNavigateToProducts && (
                <button
                  type="button"
                  onClick={onNavigateToProducts}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Go to Product Page to Add
                </button>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
              <p className="text-base font-semibold text-slate-800">
                No matching optical products found
              </p>
              <p className="text-xs text-slate-500">
                Try clearing the search filter or switching eyewear categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/80">
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4">Product</th>
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4">Category & Specs</th>
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono">HSN / GST</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Price</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">Stock</th>
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredProducts.map((product) => {
                      const inCartQty =
                        cart.find((c) => c.product.id === product.id)?.quantity || 0;
                      const isOutOfStock = product.stock <= 0;
                      const isLowStock = product.stock > 0 && product.stock <= product.reorderLevel;

                      return (
                        <tr
                          key={product.id}
                          onClick={() => !isOutOfStock && addToCart(product)}
                          className={`transition-colors select-none ${
                            isOutOfStock
                              ? 'opacity-60 bg-slate-50/50 cursor-not-allowed'
                              : inCartQty > 0
                              ? 'bg-amber-50/60 hover:bg-amber-100/70 cursor-pointer'
                              : 'hover:bg-slate-50/80 cursor-pointer'
                          }`}
                        >
                          {/* 1. Product Name, SKU & Brand */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span className="font-semibold text-slate-700">{product.sku}</span>
                              <span>·</span>
                              <span className="font-sans text-slate-600">{product.brand}</span>
                            </div>
                          </td>

                          {/* 2. Category & Specifications */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider">
                                {product.category}
                              </span>
                              {product.category === 'Power Glasses' && (product.rightEyePower || product.leftEyePower) && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-100 text-amber-900 border border-amber-300">
                                  R: {product.rightEyePower?.sph || '0'} | L: {product.leftEyePower?.sph || '0'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 truncate max-w-[260px]" title={`${product.frameShape} · ${product.frameMaterial}`}>
                              {product.frameShape} · {product.frameMaterial}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[260px]" title={product.lensFeature}>
                              {product.lensFeature}
                            </div>
                          </td>

                          {/* 3. HSN & GST */}
                          <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            <div>{product.hsnCode}</div>
                            <div className="text-[11px] text-slate-400">{product.gstRate}% GST</div>
                          </td>

                          {/* 4. Unit Price */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {fmt(product.price)}
                          </td>

                          {/* 5. Stock Level Badge */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOutOfStock
                                    ? 'bg-rose-500'
                                    : isLowStock
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              {isOutOfStock ? 'Out of Stock' : `${product.stock} in Stock`}
                            </span>
                          </td>

                          {/* 6. Action / In-Bill Status */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {inCartQty > 0 ? (
                              <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg shadow-xs">
                                <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                                <span>{inCartQty} in Bill</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOutOfStock) addToCart(product);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE COUNTER BILL & CHECKOUT (THE MARKED DIVISION) */}
      {posTab === 'bill' && (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
          {/* POS Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Active Optical Counter Bill</h2>
              <p className="text-xs text-slate-400">
                Instant GST Calculation · Frame & Rx Lens Fitting
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Bill
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* 1. Customer Details: Simplified Name and Mobile (No walk-in switch!) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Customer & Patient Details
                </span>
                {customers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Pick saved customer:</span>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="text-xs bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-900"
                    >
                      <option value="">-- Manual Entry / New Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name (e.g. Ramesh)"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500 font-semibold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={(e) => {
                        if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                        if (!/^[0-9]$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="98401 23456"
                      className="w-full pl-11 pr-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Loaded Eye Test Order Banner */}
            {activeLabInvoice && (
              <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950">
                      Loaded Eye Test Order ({activeLabInvoice.invoiceNumber})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold uppercase">
                    {activeLabInvoice.orderStatus}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-amber-200">
                  <div>
                    <span className="text-[11px] text-amber-800 font-medium block">Total Bill</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{fmt(activeLabInvoice.grandTotal)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-800 font-medium block">Advance Paid</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{fmt(activeLabInvoice.amountPaid)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-800 font-medium block">Balance to Collect</span>
                    <span className="font-mono font-extrabold text-rose-700 text-sm">{fmt(activeLabInvoice.balanceDue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Optical Eye Prescription (OD / OS) Toggle & Matrix */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAttachRx(!attachRx)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      attachRx
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {attachRx && <Check className="w-3 h-3" />}
                  </div>
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Include Optical Prescription (OD / OS) on Invoice</span>
                </button>
                {attachRx && (
                  <span className="text-[11px] font-mono text-slate-500">
                    PD: {rxData.pd}mm
                  </span>
                )}
              </div>

              {attachRx && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Prescribed Lens Type
                      </label>
                      <select
                        value={rxData.lensType}
                        onChange={(e) =>
                          setRxData({
                            ...rxData,
                            lensType: e.target.value as OpticalPrescription['lensType'],
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                      >
                        <option value="Zero-Power Blue Cut">Zero-Power Blue Cut</option>
                        <option value="Single Vision Anti-Glare">Single Vision Anti-Glare</option>
                        <option value="Bifocal">Bifocal</option>
                        <option value="Progressive High-Index">Progressive High-Index</option>
                        <option value="Photochromic Transition">Photochromic Transition</option>
                        <option value="Standard Tint">Standard Polarized / Tint</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        PD (mm)
                      </label>
                      <input
                        type="text"
                        value={rxData.pd}
                        onChange={(e) => setRxData({ ...rxData, pd: e.target.value })}
                        placeholder="63"
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md text-right"
                      />
                    </div>
                  </div>

                  {/* OD / OS Diopter Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-200">
                          <th className="py-1 text-left font-sans">Eye</th>
                          <th className="py-1 text-center">SPH</th>
                          <th className="py-1 text-center">CYL</th>
                          <th className="py-1 text-center">AXIS</th>
                          <th className="py-1 text-center">ADD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        <tr>
                          <td className="py-1.5 font-sans font-semibold text-slate-800 pr-2">
                            OD (R)
                          </td>
                          {(['sph', 'cyl', 'axis', 'add'] as const).map((field) => (
                            <td key={field} className="p-1">
                              <input
                                type="text"
                                value={rxData.rightEye[field]}
                                onChange={(e) =>
                                  setRxData({
                                    ...rxData,
                                    rightEye: { ...rxData.rightEye, [field]: e.target.value },
                                  })
                                }
                                placeholder={field === "axis" ? "0" : "0.00"} className="w-full px-1.5 py-1 text-center bg-white border border-slate-200 rounded text-xs font-mono"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 font-sans font-semibold text-slate-800 pr-2">
                            OS (L)
                          </td>
                          {(['sph', 'cyl', 'axis', 'add'] as const).map((field) => (
                            <td key={field} className="p-1">
                              <input
                                type="text"
                                value={rxData.leftEye[field]}
                                onChange={(e) =>
                                  setRxData({
                                    ...rxData,
                                    leftEye: { ...rxData.leftEye, [field]: e.target.value },
                                  })
                                }
                                className="w-full px-1.5 py-1 text-center bg-white border border-slate-200 rounded text-xs font-mono"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Cart Line Items */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Eyewear & Lens Line Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                </span>
                <button
                  type="button"
                  onClick={() => setPosTab('catalog')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  + Add more products
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 space-y-2">
                  <p>No eyewear frames or lenses in bill yet.</p>
                  <button
                    type="button"
                    onClick={() => setPosTab('catalog')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Open Product Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {item.product.name}
                          </div>
                          <div className="text-xs font-mono text-slate-500">
                            {item.product.sku} · Base: {fmt(item.product.price)} · GST{' '}
                            {item.product.gstRate}%
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          aria-label="Remove item"
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Lens Package Upgrade & Quantity Stepper */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <select
                          value={item.lensUpgradeLabel}
                          onChange={(e) => updateCartLens(item.product.id, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        >
                          {LENS_UPGRADE_OPTIONS.map((opt) => (
                            <option key={opt.label} value={opt.label}>
                              {opt.label} {opt.price > 0 ? `(+${fmt(opt.price)})` : '(Included)'}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="flex items-center border border-slate-200 rounded-md bg-white">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, -1)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-mono font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, 1)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-sm font-mono font-bold text-slate-900 min-w-[72px] text-right">
                            {fmt(
                              (item.product.price + item.lensUpgradePrice) * item.quantity -
                                item.itemDiscount
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Payment Mode, Order Stage & Discount */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Staff Discount ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={extraBillDiscount || ''}
                    onChange={(e) => setExtraBillDiscount(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Advance / Paid Now ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={calculations.grandTotal}
                    value={advancePaidInput}
                    onChange={(e) => setAdvancePaidInput(e.target.value)}
                    placeholder={`${calculations.grandTotal} (Full)`}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="UPI / QR">UPI / QR Scan</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash Counter</option>
                    <option value="Split Payment">Split Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Order Handover Status
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Completed">Instant Counter Delivery</option>
                    <option value="Lab Fitting">Send to Optical Lab</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 5. Bill Summary & Complete CTA */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Subtotal (Frames + Lenses)</span>
                <span className="font-mono">{fmt(calculations.subtotal)}</span>
              </div>
              {calculations.itemLevelDiscounts > 0 && (
                <div className="flex justify-between text-emerald-700 text-xs">
                  <span>Item Discount</span>
                  <span className="font-mono">-{fmt(calculations.itemLevelDiscounts)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-xs">
                <span>GST (CGST + SGST)</span>
                <span className="font-mono">
                  {fmt(calculations.cgst + calculations.sgst)}
                </span>
              </div>
              {extraBillDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 text-xs font-semibold">
                  <span>Staff Discount</span>
                  <span className="font-mono">-{fmt(extraBillDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono">{fmt(calculations.grandTotal)}</span>
              </div>

              {/* Advance Paid & Balance Due Breakdown */}
              <div className="p-3.5 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2 mt-2">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Advance Paid:</span>
                  <span className="font-mono font-bold text-emerald-700">{fmt(parsedAdvance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1 border-t border-amber-200">
                  <span className="text-amber-950">Balance Due to Pay:</span>
                  <span className="font-mono text-base font-extrabold text-rose-700">
                    {fmt(balanceDue)}
                  </span>
                </div>
                {balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdvancePaidInput(String(calculations.grandTotal));
                      setOrderStatus('Completed');
                    }}
                    className="w-full mt-1.5 py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Collect Full Balance ({fmt(balanceDue)}) Now
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full mt-3 py-3.5 px-5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                Generate Optical Tax Invoice ({fmt(calculations.grandTotal)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
