export function emptyInventoryLine() {
  return {
    key: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    product: null,
    countedQuantity: '',
  };
}

export function emptyReceiptLine() {
  return {
    key: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    productName: '',
    sku: '',
    quantity: '1',
    purchasePrice: '',
    unitSellingPrice: '',
  };
}

export function emptyTransferLine() {
  return {
    key: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    quantity: '1',
  };
}

export function emptyWriteOffLine() {
  return {
    key: `wo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    quantity: '1',
  };
}

export function emptyProductionInputLine() {
  return {
    key: `pi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    quantity: '1',
  };
}

export const WRITE_OFF_REASONS = ['DEFECT', 'EXPIRED', 'DAMAGE', 'SHORTAGE', 'OTHER'];

export const EXPENSE_REASONS = [
  'INTERNAL_USE',
  'STAFF_MEALS',
  'HOUSEHOLD',
  'DEPARTMENT',
  'OTHER',
];
