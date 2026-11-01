/** Empty check shell while the first open+add is still in flight. */
export function draftOrderFromTable(table) {
  if (!table) return null;
  return {
    id: null,
    orderNo: '—',
    status: 'OPEN',
    channel: 'DINE_IN',
    tableId: table.id,
    tableCode: table.code,
    guestCount: 1,
    adultCount: 1,
    childrenCount: 0,
    subtotal: 0,
    discountAmount: 0,
    waiterUserId: null,
    openedAt: null,
    items: [],
    _draft: true,
  };
}
