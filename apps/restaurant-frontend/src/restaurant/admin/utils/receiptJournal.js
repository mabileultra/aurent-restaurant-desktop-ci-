export const RECEIPT_METHODS = ['CASH', 'CARD', 'MIXED', 'CREDIT', 'ADVANCE'];
export const RECEIPT_STATUSES = ['PAID', 'PARTIAL_REFUND', 'REFUNDED'];
export const RECEIPT_CHANNELS = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'];
export const DEBT_METHODS = ['CREDIT', 'ADVANCE'];

export const EMPTY_RECEIPT_FILTERS = Object.freeze({
  search: '',
  method: '',
  status: '',
  waiterUserId: '',
  hallId: '',
  channel: '',
});

const METHOD_KEYS = {
  CASH: 'rst.reports.methodCash',
  CARD: 'rst.reports.methodCard',
  MIXED: 'rst.reports.methodMixed',
  CREDIT: 'rst.reports.methodCredit',
  ADVANCE: 'rst.reports.methodAdvance',
};

/** Local calendar days [fromDate 00:00, toDate + 1 day 00:00) as ISO instants. */
export function dayRangeToIso(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

function resolveMethods(filters, preset) {
  if (filters.method) return [filters.method];
  return preset === 'debts' ? DEBT_METHODS : [];
}

/** Filter object shared by the list query and the Excel export (empty values dropped). */
export function buildReceiptFilter({ fromDate, toDate, filters = EMPTY_RECEIPT_FILTERS, preset }) {
  const { from, to } = dayRangeToIso(fromDate, toDate);
  const filter = { from, to };
  const methods = resolveMethods(filters, preset);
  if (methods.length) filter.methods = methods;
  if (filters.status) filter.status = filters.status;
  if (filters.waiterUserId) filter.waiterUserId = filters.waiterUserId;
  if (filters.hallId) filter.hallId = Number(filters.hallId);
  if (filters.channel) filter.channel = filters.channel;
  const search = String(filters.search ?? '').trim();
  if (search) filter.search = search;
  return filter;
}

/** Spring binds `methods=CASH,CARD` to a list; axios would send `methods[]=` otherwise. */
export function toReceiptQueryParams(filter, page, size) {
  const params = { ...filter, page, size };
  if (Array.isArray(filter.methods)) params.methods = filter.methods.join(',');
  return params;
}

export function receiptMethodLabel(method, t) {
  const key = METHOD_KEYS[String(method || '').toUpperCase()];
  return key ? t(key) : (method || '—');
}

export function receiptStatusLabel(status, t) {
  return status ? t(`rst.reports.journal.status${status}`) : '—';
}

export function receiptChannelLabel(channel, t) {
  return channel ? t(`rst.reports.journal.channel${channel}`) : '—';
}

const EXPORT_COLUMNS = {
  orderNo: 'rst.reports.checkNo',
  paidAt: 'rst.reports.journal.colPaidAt',
  channel: 'rst.reports.journal.colChannel',
  hall: 'rst.reports.journal.colHall',
  table: 'rst.reports.checkTable',
  guests: 'rst.reports.journal.colGuests',
  waiter: 'rst.reports.journal.colWaiter',
  cashier: 'rst.reports.journal.colCashier',
  method: 'rst.reports.checkMethod',
  cardType: 'rst.reports.journal.colCardType',
  total: 'rst.reports.amount',
  discount: 'rst.reports.journal.colDiscount',
  service: 'rst.reports.journal.colService',
  cash: 'rst.reports.journal.totalCash',
  card: 'rst.reports.journal.totalCard',
  refund: 'rst.reports.journal.colRefund',
  net: 'rst.reports.journal.colNet',
  status: 'rst.reports.journal.colStatus',
  client: 'rst.reports.journal.colClient',
  debtPhone: 'rst.reports.debtPhone',
  debtComment: 'rst.reports.debtComment',
  advancePaid: 'rst.reports.advancePaid',
  debtRemaining: 'rst.reports.debtRemaining',
};

const EXPORT_TOTALS = {
  checkCount: 'rst.reports.journal.totalChecks',
  guestCount: 'rst.reports.journal.totalGuests',
  totalAmount: 'rst.reports.journal.totalSales',
  refundAmount: 'rst.reports.journal.totalRefunds',
  netAmount: 'rst.reports.journal.totalNet',
  averageCheck: 'rst.reports.journal.totalAverage',
  cashAmount: 'rst.reports.journal.totalCash',
  cardAmount: 'rst.reports.journal.totalCard',
  creditAmount: 'rst.reports.methodCredit',
  advanceAmount: 'rst.reports.methodAdvance',
  debtRemaining: 'rst.reports.journal.totalDebt',
  discountAmount: 'rst.reports.journal.totalDiscount',
  serviceAmount: 'rst.reports.journal.colService',
};

/** Texts for the server-side xlsx, in the UI language. */
export function buildReceiptExportLabels(t) {
  const labels = {
    title: t('rst.reports.journal.title'),
    sheet: t('rst.reports.journal.sheet'),
    period: t('rst.reports.journal.period'),
    totals: t('rst.reports.journal.totals'),
  };
  for (const [key, i18n] of Object.entries(EXPORT_COLUMNS)) labels[`col.${key}`] = t(i18n);
  for (const [key, i18n] of Object.entries(EXPORT_TOTALS)) labels[`total.${key}`] = t(i18n);
  for (const method of RECEIPT_METHODS) labels[`method.${method}`] = receiptMethodLabel(method, t);
  for (const status of RECEIPT_STATUSES) labels[`status.${status}`] = receiptStatusLabel(status, t);
  for (const channel of RECEIPT_CHANNELS) labels[`channel.${channel}`] = receiptChannelLabel(channel, t);
  return labels;
}

export function buildReceiptExportBody(filter, { userNameById, t, timeZone }) {
  const userNames = {};
  if (userNameById) {
    for (const [id, name] of userNameById) userNames[String(id)] = name;
  }
  return {
    filter,
    userNames,
    labels: buildReceiptExportLabels(t),
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

const DISH_EXPORT_COLUMNS = {
  name: 'rst.reports.dish',
  category: 'rst.reports.dishes.category',
  quantity: 'rst.reports.dishes.sold',
  returnedQuantity: 'rst.reports.dishes.returned',
  netQuantity: 'rst.reports.dishes.netQty',
  grossAmount: 'rst.reports.amount',
  refundAmount: 'rst.reports.journal.colRefund',
  netAmount: 'rst.reports.journal.colNet',
  orderCount: 'rst.reports.journal.totalChecks',
  sharePercent: 'rst.reports.dishes.share',
};

export function buildDishExportBody(filter, { t, timeZone }) {
  const labels = {
    title: t('rst.reports.dishes.title'),
    sheet: t('rst.reports.byDish'),
    period: t('rst.reports.journal.period'),
    totals: t('rst.reports.journal.colNet'),
  };
  for (const [key, i18n] of Object.entries(DISH_EXPORT_COLUMNS)) labels[`col.${key}`] = t(i18n);
  return {
    filter,
    userNames: {},
    labels,
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/** Human label for a sales breakdown key (method, card rail, channel, hall name, hour, day). */
export function breakdownLabel(group, key, t) {
  if (group === 'method') return receiptMethodLabel(key, t);
  if (group === 'channel') return receiptChannelLabel(key, t);
  if (group === 'hall') return key || t('rst.reports.summary.noHall');
  if (group === 'hour') return `${key}:00–${String((Number(key) + 1) % 24).padStart(2, '0')}:00`;
  if (group === 'day') {
    const [y, m, d] = String(key).split('-');
    return y && m && d ? `${d}.${m}.${y}` : String(key);
  }
  return key || '—';
}

export function filterDishRows(rows, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return rows ?? [];
  return (rows ?? []).filter((row) =>
    String(row.name ?? '').toLowerCase().includes(q)
    || String(row.category ?? '').toLowerCase().includes(q));
}

const SHIFT_EXPORT_COLUMNS = {
  openedAt: 'rst.reports.shifts.openedAt',
  closedAt: 'rst.reports.shifts.closedAt',
  status: 'rst.reports.journal.colStatus',
  cashier: 'rst.reports.journal.colCashier',
  opening: 'rst.shift.openingCash',
  cashSales: 'rst.reports.shifts.cashSales',
  cashIn: 'rst.shift.cashOp.typeIN',
  cashOut: 'rst.shift.cashOp.typeOUT',
  collection: 'rst.shift.cashOp.typeCOLLECTION',
  expected: 'rst.shift.expectedCash',
  closing: 'rst.reports.shifts.actual',
  difference: 'rst.reports.shifts.difference',
  handoverExpected: 'rst.shift.carryFromLast',
  handoverDiff: 'rst.reports.shifts.handoverDiff',
};

export function buildShiftExportBody(filter, { userNameById, t, timeZone }) {
  const labels = {
    title: t('rst.reports.shifts.title'),
    sheet: t('rst.reports.shifts.sheet'),
    period: t('rst.reports.journal.period'),
    totals: t('rst.reports.journal.totals'),
  };
  for (const [key, i18n] of Object.entries(SHIFT_EXPORT_COLUMNS)) labels[`col.${key}`] = t(i18n);
  labels['total.shiftCount'] = t('rst.reports.shifts.count');
  labels['total.cashSales'] = t('rst.reports.shifts.cashSales');
  labels['total.expected'] = t('rst.shift.expectedCash');
  labels['total.closing'] = t('rst.reports.shifts.actual');
  labels['total.difference'] = t('rst.reports.shifts.difference');
  const userNames = {};
  if (userNameById) {
    for (const [id, name] of userNameById) userNames[String(id)] = name;
  }
  return {
    filter,
    userNames,
    labels,
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function staffNameById(users) {
  const map = new Map();
  for (const u of users ?? []) {
    if (u?.id == null) continue;
    const id = String(u.id);
    map.set(id, u.fullName || u.username || id.slice(0, 8));
  }
  return map;
}
