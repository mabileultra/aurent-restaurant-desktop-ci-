import { roundQty } from '../../../utils/quantityFormat';

function hasFact(value) {
  if (value === '' || value == null) return false;
  return Number.isFinite(Number(value));
}

export function inventoryLineVariance(line) {
  const bookQty = Number(line.product?.stockQuantity);
  const factReady = hasFact(line.countedQuantity);
  const bookReady = Number.isFinite(bookQty);
  if (!line.productId || !factReady || !bookReady) {
    return { status: 'empty', delta: null, money: 0 };
  }
  const delta = roundQty(Number(line.countedQuantity) - bookQty);
  const cost = Number(line.product?.costPrice) || 0;
  let status = 'match';
  if (delta < -0.0004) status = 'shortage';
  else if (delta > 0.0004) status = 'surplus';
  return {
    status: Math.abs(delta) < 0.0005 ? 'match' : status,
    delta,
    money: delta * cost,
  };
}

export function summarizeInventory(lines) {
  const filled = lines.filter((line) => line.productId);
  const counted = filled.map(inventoryLineVariance).filter((row) => row.status !== 'empty');
  const match = counted.filter((row) => row.status === 'match').length;
  const shortage = counted.filter((row) => row.status === 'shortage').length;
  const surplus = counted.filter((row) => row.status === 'surplus').length;
  const money = counted.reduce((sum, row) => sum + row.money, 0);
  return {
    total: filled.length,
    match,
    shortage,
    surplus,
    withDiff: shortage + surplus,
    money,
    readyLines: counted.length,
  };
}

export function inventoryFormReady({ storeId, summary }) {
  return Boolean(storeId) && summary.readyLines > 0;
}
