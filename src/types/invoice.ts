export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id?: string;
  customerName: string;
  date: string;
  currency: 'USD' | 'KHR';
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  deliveryFee: number;
  total: number;
  sellerName: string;
}

