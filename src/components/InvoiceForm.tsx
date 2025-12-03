import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Invoice, InvoiceItem } from '../types/invoice';
import { formatCurrency } from '../utils/formatCurrency';

interface InvoiceFormProps {
  onPreview: (invoice: Invoice) => void;
}

const STORAGE_KEY = 'roth_scrub_invoice_data_v1';

// 4 Scrub Products (Khmer names)
const PRODUCTS = [
  'ស្រ្កាប់ពន្លៃរមៀត',
  'ស្ក្រាប់ដូងខ្ទិះ',
  'ស្រ្កាប់កាហ្វេ',
  'ស្ក្រាប់តែបៃតង',
];

// Helper functions
const saveToStorage = (data: object) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('💾 Data saved!', data);
  } catch (e) {
    console.error('Save failed:', e);
  }
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      console.log('📂 Data loaded!', JSON.parse(data));
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Load failed:', e);
  }
  return null;
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onPreview }) => {
  // Initialize with saved data or defaults
  const savedData = loadFromStorage();
  
  const [customerName, setCustomerName] = useState(savedData?.customerName || '');
  const [date, setDate] = useState(savedData?.date || new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'USD' | 'KHR'>(savedData?.currency || 'USD');
  const [items, setItems] = useState<InvoiceItem[]>(
    savedData?.items || [{ id: '1', name: '', quantity: 0, unitPrice: 0, amount: 0 }]
  );
  const [discountPercent, setDiscountPercent] = useState(savedData?.discountPercent || 0);
  const [deliveryFee, setDeliveryFee] = useState(savedData?.deliveryFee || 0);

  // Auto-save whenever anything changes
  useEffect(() => {
    saveToStorage({
      customerName,
      date,
      currency,
      items,
      discountPercent,
      deliveryFee
    });
  }, [customerName, date, currency, items, discountPercent, deliveryFee]);

  const addItem = () => {
    const newId = (Math.max(...items.map(i => parseInt(i.id)), 0) + 1).toString();
    setItems([...items, { id: newId, name: '', quantity: 0, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount + deliveryFee;

  const handlePreview = () => {
    const invoice: Invoice = {
      customerName: customerName.trim() || 'Unknown Customer',
      date,
      currency,
      items: items.filter(item => item.name.trim() !== ''),
      subtotal,
      discountPercent,
      deliveryFee,
      total,
      sellerName: 'Sreyroth'
    };

    onPreview(invoice);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4">
          <img src="/scrub.jpg" alt="Scrub Logo" className="w-16 h-16 mx-auto mb-2 rounded-full object-cover" />
          <h1 className="text-lg font-bold text-gray-800">Roth Scrub Invoice</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Unknown Customer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'KHR')}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="KHR">Riel (៛)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Seller</label>
              <input
                type="text"
                value="Sreyroth"
                disabled
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-800">🧴 Scrub Products</h2>
            <button
              onClick={addItem}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-600">#{index + 1}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <select
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select scrub product...</option>
                    {PRODUCTS.map((product, idx) => (
                      <option key={idx} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[10px] text-gray-600 mb-0.5">Qty</label>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-600 mb-0.5">Unit Price</label>
                      <input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-600 mb-0.5">Amount</label>
                      <div className="px-1.5 py-1 text-xs bg-gray-100 border border-gray-200 rounded font-medium text-gray-700 overflow-x-auto whitespace-nowrap">
                        {formatCurrency(item.amount, currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-medium text-gray-700">Subtotal:</span>
              <span className="text-sm font-semibold text-gray-800">{formatCurrency(subtotal, currency)}</span>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Discount:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-right"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="text-xs text-gray-600">%</span>
                <span className="text-xs text-gray-600 ml-1">= {formatCurrency(discountAmount, currency)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Delivery Fee:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={deliveryFee || ''}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-right"
                  min="0"
                  step="0.01"
                />
                <span className="text-xs text-gray-600">{currency === 'USD' ? '$' : '៛'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-t-2 border-gray-300">
              <span className="text-sm font-bold text-gray-800">Total:</span>
              <span className="text-base font-bold text-emerald-600">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePreview}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 active:bg-emerald-800 shadow-md"
        >
          Preview Invoice
        </button>
      </div>
    </div>
  );
};

