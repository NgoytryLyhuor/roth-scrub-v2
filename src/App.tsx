import { useState } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { Invoice } from './types/invoice';

function App() {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setShowPreview(true);
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showPreview && currentInvoice ? (
        <InvoicePreview invoice={currentInvoice} onBack={handleBack} />
      ) : (
        <InvoiceForm onPreview={handlePreview} />
      )}
    </div>
  );
}

export default App;

