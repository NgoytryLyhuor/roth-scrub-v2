import React, { useRef, useState } from 'react';
import { ArrowLeft, Download, Send } from 'lucide-react';
import { Invoice } from '../types/invoice';
import { formatCurrency } from '../utils/formatCurrency';
import html2canvas from 'html2canvas';

interface InvoicePreviewProps {
  invoice: Invoice;
  onBack: () => void;
}

const STORAGE_KEY = 'roth_scrub_invoice_data_v1';

// Khmer month names
const khmerMonths = [
  'មករា',      // January
  'កុម្ភៈ',     // February
  'មីនា',      // March
  'មេសា',      // April
  'ឧសភា',     // May
  'មិថុនា',    // June
  'កក្កដា',    // July
  'សីហា',      // August
  'កញ្ញា',     // September
  'តុលា',      // October
  'វិច្ឆិកា',  // November
  'ធ្នូ'       // December
];

const formatKhmerDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = khmerMonths[date.getMonth()];
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onBack }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateImage = async () => {
    if (!invoiceRef.current) return null;

    try {
      // Wait for fonts to load
      await document.fonts.ready;
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Ensure fonts are applied in cloned document
          const style = clonedDoc.createElement('style');
          style.textContent = `* { font-family: 'Hanuman', 'Nunito', sans-serif !important; }`;
          clonedDoc.head.appendChild(style);
        }
      });

      return canvas;
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    const canvas = await generateImage();
    setIsProcessing(false);

    if (!canvas) {
      alert('Failed to generate invoice image. Please try again.');
      return;
    }

    const link = document.createElement('a');
    const dateStr = invoice.date.replace(/-/g, '');
    const filename = `Scrub_Invoice_${invoice.customerName}_${dateStr}.png`;

    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();

    // Clear localStorage after successful download
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Data cleared from localStorage after download');
    
    // Go back to form
    onBack();
  };

  const handleShareToTelegram = async () => {
    setIsProcessing(true);
    const canvas = await generateImage();
    setIsProcessing(false);

    if (!canvas) {
      alert('Failed to generate invoice image. Please try again.');
      return;
    }

    try {
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to create image. Please try again.');
          return;
        }

        const file = new File([blob], `Scrub_Invoice_${invoice.customerName}.png`, { type: 'image/png' });

        // Check if Web Share API is available and supports files
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Scrub Invoice - ${invoice.customerName}`,
              text: `Scrub Invoice for ${invoice.customerName}\nTotal: ${formatCurrency(invoice.total, invoice.currency)}`
            });
            console.log('✅ Shared successfully via Web Share API');
          } catch (error: unknown) {
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error('Share failed:', error);
              fallbackToTelegramLink();
            }
          }
        } else {
          // Fallback: Open Telegram with text (can't share image directly via URL)
          fallbackToTelegramLink();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing to Telegram:', error);
      alert('Failed to share. Please try downloading and sharing manually.');
    }
  };

  const fallbackToTelegramLink = () => {
    const text = `Scrub Invoice for ${invoice.customerName}\nDate: ${invoice.date}\nTotal: ${formatCurrency(invoice.total, invoice.currency)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    
    alert('Opening Telegram... Note: You will need to manually attach the invoice image after downloading it.');
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <div className="max-w-2xl mx-auto mb-3 flex gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          disabled={isProcessing}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={handleShareToTelegram}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
          disabled={isProcessing}
        >
          <Send size={16} />
          {isProcessing ? 'Processing...' : 'Share'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          disabled={isProcessing}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white shadow-lg">
        <div ref={invoiceRef} className="p-4">
          <div className="text-center mb-4 pb-3 border-b-2 border-emerald-700">
            <img src="/scrub.jpg" alt="Scrub Logo" className="w-20 h-20 mx-auto mb-2 rounded-full object-cover" />
            <div className="text-xs text-gray-600">វិក័យប័ត្រ Scrub</div>
            <h1 className="text-2xl font-bold text-emerald-700 mb-1">SCRUB INVOICE</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div>
              <div className="font-semibold text-gray-700 mb-1">អតិថិជន / Customer:</div>
              <div className="text-gray-900">{invoice.customerName}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">ថ្ងៃទី / Date:</div>
              <div className="text-gray-900">{formatKhmerDate(invoice.date)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">អ្នកលក់ / Seller:</div>
              <div className="text-gray-900">{invoice.sellerName}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">រូបិយប័ណ្ណ / Currency:</div>
              <div className="text-gray-900">{invoice.currency === 'USD' ? 'ដុល្លារ ($)' : 'រៀល (៛)'}</div>
            </div>
          </div>

          <div className="mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="border border-emerald-600 px-1.5 py-1.5 text-[10px] font-semibold w-8">ល.រ<br/><span className="font-normal">No</span></th>
                  <th className="border border-emerald-600 px-1.5 py-1.5 text-[10px] font-semibold text-left">ឈ្មោះទំនិញ<br/><span className="font-normal">Product</span></th>
                  <th className="border border-emerald-600 px-1.5 py-1.5 text-[10px] font-semibold w-14">បរិមាណ<br/><span className="font-normal">Qty</span></th>
                  <th className="border border-emerald-600 px-1.5 py-1.5 text-[10px] font-semibold w-20">តម្លៃ<br/><span className="font-normal">Price</span></th>
                  <th className="border border-emerald-600 px-1.5 py-1.5 text-[10px] font-semibold w-24">សរុប<br/><span className="font-normal">Amount</span></th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px] text-center">{index + 1}</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px]">{item.name}</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px] text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px] text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px] text-right font-semibold">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 4 - invoice.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px] text-center">&nbsp;</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px]">&nbsp;</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px]">&nbsp;</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px]">&nbsp;</td>
                    <td className="border border-gray-300 px-1.5 py-1.5 text-[10px]">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-4">
            <div className="w-64 space-y-1">
              <div className="flex justify-between items-center py-1 border-b border-gray-300">
                <span className="text-xs font-semibold text-gray-700">សរុបរង / Subtotal:</span>
                <span className="text-xs font-bold text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>

              {invoice.discountPercent > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-gray-300">
                  <span className="text-xs font-semibold text-gray-700">បញ្ចុះតម្លៃ / Discount ({invoice.discountPercent}%):</span>
                  <span className="text-xs font-bold text-red-600">-{formatCurrency(invoice.subtotal * (invoice.discountPercent / 100), invoice.currency)}</span>
                </div>
              )}

              {invoice.deliveryFee > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-gray-300">
                  <span className="text-xs font-semibold text-gray-700">ថ្លៃដឹកជញ្ជូន / Delivery:</span>
                  <span className="text-xs font-bold text-emerald-600">+{formatCurrency(invoice.deliveryFee, invoice.currency)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 bg-emerald-700 text-white px-2 rounded">
                <span className="text-sm font-bold">សរុប / TOTAL:</span>
                <span className="text-base font-bold">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment QR Codes Section */}
          <div className="border-t-2 border-emerald-700 pt-4 mt-4">
            <div className="text-center mb-4">
              <p className="text-sm font-bold text-emerald-700">ស្កេនដើម្បីបង់ប្រាក់</p>
              <p className="text-xs text-gray-600">Scan to Pay</p>
            </div>
            <div className="flex justify-center gap-6">
              <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <img src="/qr-code-dolla.jpg" alt="USD QR Code" className="w-44 h-auto mx-auto rounded shadow-sm" />
                <p className="text-xs text-gray-700 mt-2 font-semibold">ដុល្លារ / USD</p>
              </div>
              <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <img src="/qr-code-rial.jpg" alt="Riel QR Code" className="w-44 h-auto mx-auto rounded shadow-sm" />
                <p className="text-xs text-gray-700 mt-2 font-semibold">រៀល / KHR</p>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-300 pt-3 mt-4 text-center">
            <p className="text-[10px] text-gray-600 italic">សូមអរគុណ!</p>
            <p className="text-[10px] text-gray-600 italic">Thank you for your purchase!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

