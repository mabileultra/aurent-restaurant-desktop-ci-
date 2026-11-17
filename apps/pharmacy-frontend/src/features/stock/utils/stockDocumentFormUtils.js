export const STOCK_DOC_INPUT_CLS =
  'ui-input h-9 px-2.5 py-1.5 text-sm';

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
