import { emptyPaymentForm, paymentFormFromReceipt } from './pharmacyReceiptPayments';

export function todayInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function emptyHeaderForm() {
  return {
    supplierId: '',
    storeId: '',
    documentDate: todayInputValue(),
    receiptType: 'RECEIPT',
    defaultMarkupPercent: '18',
    invoiceNumber: '',
    invoiceDate: '',
    contractNumber: '',
    financialDiscount: '',
    payment: emptyPaymentForm(),
    notes: '',
  };
}

export function normalizeHeaderInitial(initial) {
  if (!initial) return {};
  return {
    supplierId: initial.supplierId != null ? String(initial.supplierId) : '',
    invoiceNumber: initial.invoiceNumber || '',
    invoiceDate: initial.invoiceDate || '',
    contractNumber: initial.contractNumber || '',
    financialDiscount: initial.financialDiscount != null ? String(initial.financialDiscount) : '',
    payment: paymentFormFromReceipt(initial),
    notes: initial.notes || '',
  };
}
