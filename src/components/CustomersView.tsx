import React, { useState } from 'react';
import { Search, UserPlus, ShoppingBag, Eye, X, Trash2, Users, Receipt } from 'lucide-react';
import { Customer, OpticalPrescription, StoreSettings } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  invoices?: any[];
  settings: StoreSettings;
  onAddCustomer: (
    customer: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>,
    customAmount?: number,
    customDate?: string,
    customAdvance?: number,
    customOrderCount?: number
  ) => void;
  onUpdateCustomerRx: (customerId: string, rx: OpticalPrescription) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onBillCustomerInPos: (customerId: string) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  settings,
  onAddCustomer,
  onUpdateCustomerRx,
  onUpdateCustomer,
  onBillCustomerInPos,
  onDeleteCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [ordersCount, setOrdersCount] = useState('1');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Customer & Rx form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [lensType, setLensType] =
    useState<OpticalPrescription['lensType']>('Single Vision Anti-Glare');
  const [pd, setPd] = useState('');
  const [notes, setNotes] = useState('');
  const [odSph, setOdSph] = useState('');
  const [odCyl, setOdCyl] = useState('');
  const [odAxis, setOdAxis] = useState('');
  const [odAdd, setOdAdd] = useState('');
  const [osSph, setOsSph] = useState('');
  const [osCyl, setOsCyl] = useState('');
  const [osAxis, setOsAxis] = useState('');
  const [osAdd, setOsAdd] = useState('');

  const openNewCustomerModal = () => {
    setEditingCustomerId(null);
    setName('');
    setPhone('');
    setEmail('');
    setAge('');
    setAmount('');
    setAdvanceAmount('');
    setOrdersCount('');
    setVisitDate(new Date().toISOString().slice(0, 10));
    setLensType('Single Vision Anti-Glare');
    setPd('');
    setNotes('');
    setOdSph('');
    setOdCyl('');
    setOdAxis('');
    setOdAdd('');
    setOsSph('');
    setOsCyl('');
    setOsAxis('');
    setOsAdd('');
    setIsModalOpen(true);
  };

  const openEditRxModal = (cust: Customer) => {
    setEditingCustomerId(cust.id);
    setName(cust.name);
    setPhone(cust.phone.replace(/\D/g, '').slice(-10));
    setEmail(cust.email);
    setAge(String(cust.age || 35));
    setAmount(cust.totalSpent > 0 ? String(cust.totalSpent) : '');
    const custInv = invoices?.find((i: any) => i.customerId === cust.id);
    setAdvanceAmount(custInv?.amountPaid !== undefined ? String(custInv.amountPaid) : '');
    setOrdersCount(String(cust.ordersCount || 1));
    setVisitDate(cust.lastVisit || new Date().toISOString().slice(0, 10));
    const rx = cust.prescription;
    setLensType(rx?.lensType || 'Single Vision Anti-Glare');
    setPd(rx?.pd || '63');
    setNotes(rx?.notes || '');
    setOdSph(rx?.rightEye.sph || '');
    setOdCyl(rx?.rightEye.cyl || '');
    setOdAxis(rx?.rightEye.axis || '');
    setOdAdd(rx?.rightEye.add || '');
    setOsSph(rx?.leftEye.sph || '');
    setOsCyl(rx?.leftEye.cyl || '');
    setOsAxis(rx?.leftEye.axis || '');
    setOsAdd(rx?.leftEye.add || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.max(0, Number(amount) || 0);
    const parsedAdvance = advanceAmount !== '' ? Math.max(0, Number(advanceAmount) || 0) : parsedAmount;
    const parsedOrderCount = Math.max(1, Number(ordersCount) || 1);
    const chosenDate = visitDate || new Date().toISOString().slice(0, 10);
    const cleanDigits = phone.replace(/\D/g, '').slice(0, 10);
    if (!editingCustomerId && cleanDigits.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91 ${cleanDigits}` : (cleanDigits ? `+91 ${cleanDigits}` : '+91 98400 00000');

    const rxPayload: OpticalPrescription = {
      rightEye: {
        sph: odSph.trim() || '0.00',
        cyl: odCyl.trim() || '0.00',
        axis: odAxis.trim() || '0',
        add: odAdd.trim() || '+0.00',
      },
      leftEye: {
        sph: osSph.trim() || '0.00',
        cyl: osCyl.trim() || '0.00',
        axis: osAxis.trim() || '0',
        add: osAdd.trim() || '+0.00',
      },
      pd: pd.trim() || '63',
      lensType,
      notes,
      recordedAt: chosenDate,
    };

    if (editingCustomerId) {
      if (onUpdateCustomer) {
        const existing = customers.find((c) => c.id === editingCustomerId);
        if (existing) {
          onUpdateCustomer({
            ...existing,
            name: name.trim() || existing.name,
            phone: formattedPhone || existing.phone,
            email: email.trim(),
            age: Number(age) || existing.age,
            totalSpent: parsedAmount || existing.totalSpent,
            ordersCount: parsedOrderCount,
            lastVisit: chosenDate,
            prescription: rxPayload,
          });
        }
      } else {
        onUpdateCustomerRx(editingCustomerId, rxPayload);
      }
    } else {
      if (!name.trim()) return;
      onAddCustomer(
        {
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim(),
          age: Number(age) || undefined,
          prescription: rxPayload,
          isNewPatient: true,
        },
        parsedAmount,
        chosenDate,
        parsedAdvance,
        parsedOrderCount
      );
    }
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const fmt = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const getExpandedCustomerItems = (custInvoices: any[], cust: Customer) => {
    const list: any[] = [];
    (custInvoices || []).forEach((inv: any) => {
      (inv.items || []).forEach((item: any) => {
        const qty = Number(item.quantity) && Number(item.quantity) > 1 ? Number(item.quantity) : 1;
        const rawUnitPrice = item.unitPrice || Math.round((item.lineTotal || 0) / qty);
        const gstRate = item.gstRate !== undefined ? item.gstRate : (inv.gstRate !== undefined ? inv.gstRate : 12);
        const itemDiscount = item.discount || 0;
        const paymentMethod = inv.paymentMethod || 'UPI / QR';

        if (qty > 1) {
          for (let i = 1; i <= qty; i++) {
            list.push({
              ...item,
              name: `${item.name} (Item #${i})`,
              quantity: 1,
              unitPrice: rawUnitPrice,
              lineTotal: rawUnitPrice,
              gstRate: gstRate,
              discount: Math.round(itemDiscount / qty),
              paymentMethod: paymentMethod,
              invoiceNumber: inv.invoiceNumber,
            });
          }
        } else {
          list.push({
            ...item,
            quantity: 1,
            unitPrice: rawUnitPrice,
            lineTotal: item.lineTotal || rawUnitPrice,
            gstRate: gstRate,
            discount: itemDiscount,
            paymentMethod: paymentMethod,
            invoiceNumber: inv.invoiceNumber,
          });
        }
      });
    });

    // Fallback: If no invoice items found, but customer has totalSpent or ordersCount > 0
    if (list.length === 0 && (cust.ordersCount || cust.totalSpent)) {
      const count = Math.max(1, cust.ordersCount || 1);
      const unitAmt = Math.round((cust.totalSpent || 0) / count);
      const baseName = cust.prescription?.lensType
        ? `Rx: ${cust.prescription.lensType}`
        : 'Eyewear Purchase';
      for (let i = 1; i <= count; i++) {
        list.push({
          productId: `gen-item-${i}`,
          name: count > 1 ? `${baseName} (Item #${i})` : baseName,
          quantity: 1,
          unitPrice: unitAmt,
          lineTotal: unitAmt,
          discount: 0,
          gstRate: 12,
          paymentMethod: 'UPI / QR',
        });
      }
    }

    return list;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customers & Optometry Prescriptions (Rx)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Store OD/OS eye power measurements, pupillary distance (PD), and load directly into POS
          </p>
        </div>
        <button
          type="button"
          onClick={openNewCustomerModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          New Patient & Eye Test
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone number, or email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Customer & Rx Table View (Row by Row) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/80">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 font-mono">Phone Number</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Order Items</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800">No Customers Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click &quot;New Patient &amp; Eye Test&quot; above to register your first patient.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const pendingInvoice = invoices?.find(
                    (inv: any) =>
                      inv.customerId === customer.id &&
                      inv.orderStatus === 'Lab Fitting'
                  );
                  const canLoadToPos = Boolean(customer.isNewPatient || pendingInvoice);

                  // Match customer's invoices by customerId or matching phone number
                  const custInvoices = invoices?.filter(
                    (inv: any) =>
                      inv.customerId === customer.id ||
                      (inv.customerPhone &&
                        customer.phone &&
                        inv.customerPhone.replace(/\D/g, '').slice(-10) ===
                          customer.phone.replace(/\D/g, '').slice(-10))
                  ) || [];

                  const custGrossTotal = custInvoices.reduce(
                    (sum: number, inv: any) =>
                      sum + (inv.subtotal || 0) + (inv.cgstAmount || 0) + (inv.sgstAmount || 0),
                    0
                  );

                  const rowItems = getExpandedCustomerItems(custInvoices, customer);
                  const productNames =
                    rowItems.length > 0
                      ? rowItems.map((i: any) => i.name).filter(Boolean).join(', ')
                      : pendingInvoice?.items?.[0]?.name ||
                        (customer.prescription
                          ? `Rx: ${customer.prescription.lensType}`
                          : 'Eyewear Purchase');
                  const orderItemsCount = Math.max(rowItems.length, customer.ordersCount || 1);

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* 1. Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {customer.name}
                          {customer.age ? (
                            <span className="text-xs font-normal text-slate-500 ml-1.5">
                              ({customer.age} yrs)
                            </span>
                          ) : null}
                        </div>
                        {pendingInvoice && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Eye Test ({pendingInvoice.invoiceNumber})
                          </span>
                        )}
                      </td>

                      {/* 2. Phone Number */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {customer.phone}
                      </td>

                      {/* 3. Product Name */}
                      <td className="py-3.5 px-4">
                        <div
                          className="text-xs font-medium text-slate-800 line-clamp-1 max-w-[260px]"
                          title={productNames}
                        >
                          {productNames}
                        </div>
                        {customer.prescription && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            PD: {customer.prescription.pd} mm
                          </div>
                        )}
                      </td>

                      {/* 4. Order Items */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium">
                          {orderItemsCount} {orderItemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* 5. Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div>{fmt(custGrossTotal > 0 ? custGrossTotal : customer.totalSpent)}</div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          {custInvoices[0]?.paymentMethod && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-sans">
                              {custInvoices[0].paymentMethod}
                            </span>
                          )}
                          {pendingInvoice && pendingInvoice.balanceDue > 0 && (
                            <span className="text-[11px] font-normal text-rose-600 font-mono">
                              Due: {fmt(pendingInvoice.balanceDue)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Action: View & Load into Billing POS */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingCustomer(customer)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>
                          {canLoadToPos && (
                            <button
                              type="button"
                              onClick={() => onBillCustomerInPos(customer.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                              <span>Load into Billing POS</span>
                            </button>
                          )}
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

      {/* Add Customer / Update Rx Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-xl my-2 sm:my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0">
              <h2 className="text-base font-semibold">
                {editingCustomerId
                  ? `Update Optometry Prescription · ${name}`
                  : 'Register Customer & Eye Prescription'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {!editingCustomerId && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Patient / Customer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number (10 Digits)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500 font-semibold select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        required
                        maxLength={10}
                        minLength={10}
                        value={phone.replace(/\D/g, '').slice(0, 10)}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onKeyDown={(e) => {
                          // Allow navigation, backspace, delete, tab
                          if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                          // Block non-digit keys
                          if (!/^[0-9]$/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="98401 23456"
                        className="w-full pl-11 pr-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Order Financials, Advance & Order Count */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Order Financials & Advance Payment</span>
                  <span className="font-mono text-slate-600">
                    Balance Due:{' '}
                    <span className="font-bold text-amber-700">
                      {settings.currencySymbol}
                      {Math.max(
                        0,
                        (Number(amount) || 0) - (advanceAmount !== '' ? Number(advanceAmount) || 0 : (Number(amount) || 0))
                      ).toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Total Amount ({settings.currencySymbol}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 2500"
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Advance Paid ({settings.currencySymbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Order Count (Pcs)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={ordersCount}
                      onChange={(e) => setOrdersCount(e.target.value)}
                      placeholder="1"
                      className="w-full px-2 py-1.5 text-xs font-mono text-center font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Test / Visit Date
                    </label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Recommended Lens Type
                  </label>
                  <select
                    value={lensType}
                    onChange={(e) =>
                      setLensType(e.target.value as OpticalPrescription['lensType'])
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Zero-Power Blue Cut">Zero-Power Blue Cut</option>
                    <option value="Single Vision Anti-Glare">Single Vision Anti-Glare</option>
                    <option value="Bifocal">Bifocal</option>
                    <option value="Progressive High-Index">Progressive High-Index</option>
                    <option value="Photochromic Transition">Photochromic Transition</option>
                    <option value="Standard Tint">Standard Tint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pupillary Dist (PD mm)
                  </label>
                  <input
                    type="text"
                    value={pd}
                    onChange={(e) => setPd(e.target.value)}
                    placeholder="e.g. 63"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Diopter Entry Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Diopter Measurements (SPH / CYL / AXIS / ADD)
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-1.5 text-left font-sans">Eye</th>
                      <th className="py-1.5 text-center">SPH</th>
                      <th className="py-1.5 text-center">CYL</th>
                      <th className="py-1.5 text-center">AXIS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 font-sans font-semibold text-slate-800">
                        OD (Right)
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={odSph} placeholder="0.00" onChange={(e) => setOdSph(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={odCyl} placeholder="0.00" onChange={(e) => setOdCyl(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={odAxis} placeholder="0" onChange={(e) => setOdAxis(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 font-sans font-semibold text-slate-800">
                        OS (Left)
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={osSph} placeholder="0.00" onChange={(e) => setOsSph(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={osCyl} placeholder="0.00" onChange={(e) => setOsCyl(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={osAxis} placeholder="0" onChange={(e) => setOsAxis(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Optometrist Clinical Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Computer vision strain, recommends anti-reflective coating"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Save Prescription Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Details & Rx Modal */}
      {viewingCustomer && (() => {
        const viewPendingInvoice = invoices?.find(
          (inv: any) =>
            inv.customerId === viewingCustomer.id &&
            inv.orderStatus === 'Lab Fitting'
        );
        const canLoadToPos = Boolean(viewingCustomer.isNewPatient || viewPendingInvoice);

        // Match customer's invoices by customerId or matching 10-digit phone
        const viewCustomerInvoices = invoices?.filter(
          (inv: any) =>
            inv.customerId === viewingCustomer.id ||
            (inv.customerPhone &&
              viewingCustomer.phone &&
              inv.customerPhone.replace(/\D/g, '').slice(-10) ===
                viewingCustomer.phone.replace(/\D/g, '').slice(-10))
        ) || [];

        const viewPurchasedItems = getExpandedCustomerItems(viewCustomerInvoices, viewingCustomer);
        const totalBaseAmount = viewPurchasedItems.reduce(
          (sum: number, it: any) => sum + (it.unitPrice || it.lineTotal || 0) * (it.quantity || 1),
          0
        );
        const totalTaxAmount = viewCustomerInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.cgstAmount || 0) + (inv.sgstAmount || 0),
          0
        );
        const totalGrossAmount = totalBaseAmount + totalTaxAmount;
        const totalStaffDiscount = viewCustomerInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.totalDiscount || 0),
          0
        );
        const finalTotalAmount = Math.max(0, totalGrossAmount - totalStaffDiscount);

        const primaryPaymentMethod =
          viewCustomerInvoices[0]?.paymentMethod || 'UPI / QR';
        const totalItemsQty = viewPurchasedItems.reduce(
          (sum: number, it: any) => sum + (it.quantity || 1),
          0
        );
        const actualPaidAmount = viewCustomerInvoices.length > 0
          ? viewCustomerInvoices.reduce(
              (sum: number, inv: any) => sum + (inv.amountPaid !== undefined ? inv.amountPaid : inv.grandTotal || 0),
              0
            )
          : (viewingCustomer.totalSpent || 0);

        const displayTopAmount =
          totalGrossAmount > 0 ? totalGrossAmount : (actualPaidAmount || viewingCustomer.totalSpent || 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-semibold">
                    Customer & Optometry Profile
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Customer Basics */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {viewingCustomer.name}
                        {viewingCustomer.age ? (
                          <span className="text-xs font-normal text-slate-500 ml-2">
                            · {viewingCustomer.age} years old
                          </span>
                        ) : null}
                      </h3>
                      <div className="text-xs font-mono text-slate-600 mt-1">
                        Phone: <span className="font-semibold text-slate-800">{viewingCustomer.phone}</span>
                        {viewingCustomer.email ? ` · Email: ${viewingCustomer.email}` : ''}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-base font-bold text-slate-900">
                        {fmt(displayTopAmount)}
                      </div>
                      {totalStaffDiscount > 0 && (
                        <div className="text-[11px] font-semibold text-emerald-700">
                          Final: {fmt(finalTotalAmount)}
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        {Math.max(viewPurchasedItems.length, viewingCustomer.ordersCount || 1)} orders · Last Visit: {viewingCustomer.lastVisit}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchased Products & Staff Discount Details */}
                {viewPurchasedItems.length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Purchased Products ({viewPurchasedItems.length})
                      </span>
                      {totalStaffDiscount > 0 && (
                        <span className="text-xs font-semibold font-mono text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                          Staff Discount: -{fmt(totalStaffDiscount)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {viewPurchasedItems.map((item: any, idx: number) => {
                        const itemUnitPrice = item.unitPrice || item.lineTotal || 0;
                        const itemQty = item.quantity || 1;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {item.name}
                              </div>
                              <div className="text-xs font-mono text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                                {item.sku ? <span>SKU: {item.sku}</span> : null}
                                <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Qty: {itemQty}
                                </span>
                                {item.lensUpgradeLabel && item.lensUpgradeLabel !== 'Standard Included Lens' ? (
                                  <span>· {item.lensUpgradeLabel}</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="text-sm font-extrabold text-slate-900">
                                {fmt(item.lineTotal || itemUnitPrice * itemQty)}
                              </div>
                              {item.discount > 0 && (
                                <div className="text-[11px] text-emerald-600">
                                  Discount: -{fmt(item.discount)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Products &amp; Quantity:</span>
                        <span className="font-mono font-semibold">
                          {viewPurchasedItems.length} products ({totalItemsQty} pcs)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Product Subtotal Amount:</span>
                        <span className="font-mono font-semibold">{fmt(totalBaseAmount)}</span>
                      </div>
                      <div className="flex justify-between text-blue-700">
                        <span>GST Amount (CGST + SGST):</span>
                        <span className="font-mono font-semibold">
                          {totalTaxAmount > 0 ? `+${fmt(totalTaxAmount)}` : fmt(0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold py-0.5 border-t border-slate-200/80">
                        <span>Total Amount:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {fmt(totalGrossAmount)}
                        </span>
                      </div>
                      {totalStaffDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Staff Discount Amount:</span>
                          <span className="font-mono font-bold">-{fmt(totalStaffDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1.5 pb-0.5 border-t border-slate-200">
                        <span>Final Total Amount:</span>
                        <span className="font-mono text-base font-extrabold text-slate-900">
                          {fmt(finalTotalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700 items-center pt-1 border-t border-slate-100">
                        <span>Payment Mode:</span>
                        <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-mono text-[11px]">
                          {primaryPaymentMethod}
                        </span>
                      </div>

                      {viewPendingInvoice && viewPendingInvoice.balanceDue > 0 ? (
                        <>
                          <div className="flex justify-between text-emerald-700 font-semibold text-xs pt-0.5">
                            <span>Advance Paid Amount:</span>
                            <span className="font-mono font-bold">{fmt(actualPaidAmount)}</span>
                          </div>
                          <div className="flex justify-between text-rose-700 font-bold text-xs">
                            <span>Balance to Collect:</span>
                            <span className="font-mono font-extrabold">
                              {fmt(viewPendingInvoice.balanceDue)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-emerald-700 font-semibold text-xs pt-0.5">
                          <span>Total Paid Amount:</span>
                          <span className="font-mono font-bold">{fmt(actualPaidAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prescription Details */}
                {viewingCustomer.prescription ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 uppercase tracking-wider">
                        Prescribed Lens: {viewingCustomer.prescription.lensType}
                      </span>
                      <span className="font-mono text-slate-600">
                        PD: {viewingCustomer.prescription.pd} mm · Tested: {viewingCustomer.prescription.recordedAt}
                      </span>
                    </div>

                    <table className="w-full text-xs font-mono border-collapse bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                          <th className="py-2 px-3 text-left font-sans">Eye</th>
                          <th className="py-2 px-3 text-right">SPH</th>
                          <th className="py-2 px-3 text-right">CYL</th>
                          <th className="py-2 px-3 text-right">AXIS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                            Right Eye (OD)
                          </td>
                          <td className="py-2 px-3 text-right">{viewingCustomer.prescription.rightEye.sph}</td>
                          <td className="py-2 px-3 text-right">{viewingCustomer.prescription.rightEye.cyl}</td>
                          <td className="py-2 px-3 text-right">{viewingCustomer.prescription.rightEye.axis}°</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                            Left Eye (OS)
                          </td>
                          <td className="py-2 px-3 text-right">{viewingCustomer.prescription.leftEye.sph}</td>
                          <td className="py-2 px-3 text-right">{viewingCustomer.prescription.leftEye.cyl}</td>
                          <td className="py-2 px-3 text-right">{viewingCustomer.prescription.leftEye.axis}°</td>
                        </tr>
                      </tbody>
                    </table>

                    {viewingCustomer.prescription.notes && (
                      <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-800">Optometrist Clinical Notes:</span>{' '}
                        {viewingCustomer.prescription.notes}
                      </div>
                    )}
                  </div>
                ) : viewPurchasedItems.length === 0 && !viewPendingInvoice ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                    No optical prescription or purchases recorded for this customer.
                  </div>
                ) : null}
              </div>

              <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                {canLoadToPos && (
                  <button
                    type="button"
                    onClick={() => {
                      const custId = viewingCustomer.id;
                      setViewingCustomer(null);
                      onBillCustomerInPos(custId);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    Load into Billing POS
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
