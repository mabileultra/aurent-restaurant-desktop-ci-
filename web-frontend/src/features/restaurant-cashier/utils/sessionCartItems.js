const KITCHEN_STATUS_LABEL = {
  PENDING: 'restaurantCashier.kitchen_PENDING',
  IN_PROGRESS: 'restaurantCashier.kitchen_IN_PROGRESS',
  READY: 'restaurantCashier.kitchen_READY',
  SERVED: 'restaurantCashier.kitchen_SERVED',
};

export function sessionLineToCartItem(line) {
  const qty = Number(line.quantity);
  const saleType = Number.isInteger(qty) && qty >= 1 ? 'PIECE' : 'WEIGHT';
  return {
    lineId: line.id,
    productId: line.productId,
    name: line.productName,
    sku: line.productCode ?? '',
    saleType,
    unitCode: saleType === 'WEIGHT' ? 'KG' : 'PCS',
    unitPrice: Number(line.unitPrice),
    quantity: qty,
    discountPercent: Number(line.lineDiscountPercent ?? 0),
    discount: 0,
    taxRate: 0,
    kitchenDepartment: line.kitchenDepartment ?? null,
    kitchenRoutable: line.kitchenRoutable !== false,
    kitchenStatus: line.kitchenStatus ?? null,
    kitchenStatusLabelKey: line.kitchenStatus ? KITCHEN_STATUS_LABEL[line.kitchenStatus] : null,
  };
}

export function sessionToCartItems(session) {
  if (!session?.lines?.length) return [];
  return session.lines.map(sessionLineToCartItem);
}

export function groupUnsentKitchenLines(lines = []) {
  const groups = new Map();
  let total = 0;
  lines.forEach((line) => {
    if (line.kitchenStatus || line.kitchenRoutable === false) return;
    const department = line.kitchenDepartment || 'GENERAL';
    const prev = groups.get(department) ?? 0;
    groups.set(department, prev + 1);
    total += 1;
  });
  return { groups, total };
}
