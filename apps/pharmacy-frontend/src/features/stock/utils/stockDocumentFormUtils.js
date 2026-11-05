export const STOCK_DOC_INPUT_CLS =
  'w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800';

export function emptyReceiptLine() {
  return {
    productId: '',
    quantity: '1',
    purchasePrice: '',
    unitSellingPrice: '',
  };
}

export function emptyInventoryLine() {
  return {
    key: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    product: null,
    countedQuantity: '',
  };
}

export function emptyTransferLine() {
  return { productId: '', quantity: '1' };
}
