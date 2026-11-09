import { buildQrPayload } from '../../../utils/fiscalReceiptFormat';

const MON_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const MON_FULL = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

export function formatCompact(num) {
  const val = Number(num || 0);
  if (!val) return '0';
  if (val >= 1e9) return `${(val / 1e9).toFixed(2).replace('.', ',')} mlrd`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1).replace('.', ',')} mln`;
  if (val >= 1e3) return `${Math.round(val / 1e3).toLocaleString('ru-RU')} ming`;
  return Number(val).toLocaleString('ru-RU');
}

export function formatNumber(num, maxDecimals = 0) {
  return Number(num || 0)
    .toLocaleString('ru-RU', { maximumFractionDigits: maxDecimals })
    .replace(/\u00A0/g, ' ');
}

export function formatPercent(val) {
  if (val == null) return '—';
  const rounded = Math.round(Number(val) * 10) / 10;
  return `${String(rounded).replace('.', ',')}%`;
}

export function calculateDonutArc(percent, radius = 44) {
  const circ = 2 * Math.PI * radius;
  const p = Math.min(100, Math.max(0, Number(percent || 0)));
  const dashLen = Math.max(3, (circ * p) / 100);
  return `${dashLen.toFixed(1)} ${circ.toFixed(1)}`;
}

export function prepareProductsList(rawProducts, sortType = 'sum', pageOrShowAll = 0, pageSize = 10) {
  const byQty = sortType === 'qty';
  const total = rawProducts.reduce((acc, p) => acc + (p[2] || 0), 0) || 1;
  const sorted = [...rawProducts].sort((a, b) => (byQty ? (b[1] - a[1]) || (b[2] - a[2]) : b[2] - a[2]));
  const maxV = byQty ? (sorted[0]?.[1] || 1) : (sorted[0]?.[2] || 1);

  const isShowAll = pageOrShowAll === true;
  const totalCount = rawProducts.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const page = isShowAll ? 0 : Math.max(0, Math.min(typeof pageOrShowAll === 'number' ? pageOrShowAll : 0, totalPages - 1));
  const start = isShowAll ? 0 : page * pageSize;
  const visible = isShowAll ? sorted : sorted.slice(start, start + pageSize);

  const from = totalCount === 0 ? 0 : start + 1;
  const to = isShowAll ? totalCount : Math.min(start + pageSize, totalCount);

  const products = visible.map((p, idx) => ({
    rank: start + idx + 1,
    name: p[0],
    qty: `${formatNumber(p[1])} dona`,
    amount: `${formatCompact(p[2])} so‘m`,
    share: formatPercent((p[2] / total) * 100),
    barWidth: `${Math.max(2, ((byQty ? p[1] : p[2]) / maxV) * 100)}%`,
  }));

  return { products, totalCount, from, to, page, totalPages, pageSize };
}

export function parseDayLabels(dateStr) {
  if (!dateStr) return { short: '', long: '' };
  const [y, m, d] = dateStr.split('-').map(Number);
  const short = `${d}-${MON_SHORT[m - 1]}`;
  const long = `${d}-${MON_FULL[m - 1]}, ${y}`;
  return { short, long };
}

export function prepareDayChips(receipts) {
  const days = Array.from(new Set(receipts.map((r) => r[1]))).sort();
  return days.map((d) => {
    const rs = receipts.filter((r) => r[1] === d);
    const daySum = rs.reduce((acc, r) => acc + (r[5] || 0), 0);
    const hasPending = rs.some((r) => !r[7]);
    const { short, long } = parseDayLabels(d);
    return {
      date: d,
      label: short,
      shortLabel: short,
      longLabel: long,
      sub: `${rs.length} chek · ${formatCompact(daySum)}`,
      subText: `${rs.length} chek · ${formatCompact(daySum)}`,
      totalAmount: daySum,
      hasPending,
    };
  });
}

export function filterDayReceipts(receipts, day, kind = 'all') {
  const dayRecs = receipts
    .filter((r) => r[1] === day)
    .sort((a, b) => b[2].localeCompare(a[2]) || b[0].localeCompare(a[0]));

  const totalFiscal = dayRecs.filter((r) => r[7]).length;
  const totalNonFiscal = dayRecs.length - totalFiscal;
  const filtered = dayRecs.filter((r) => (kind === 'f' ? r[7] : kind === 'n' ? !r[7] : true));
  const dayTotal = dayRecs.reduce((acc, r) => acc + (r[5] || 0), 0);

  return {
    rows: filtered,
    totalFiscal,
    totalNonFiscal,
    totalCount: dayRecs.length,
    dayTotalCount: dayRecs.length,
    dayTotal,
    dayTotalFormatted: `${formatCompact(dayTotal)} so‘m`,
  };
}

export function prepareReceiptDetail(r) {
  if (!r) return null;
  if (!Array.isArray(r) && typeof r === 'object') {
    const hasFiscalSign = Boolean(r.fiscalSign && String(r.fiscalSign).trim() !== '' && r.fiscalSign !== '—');
    const hasFiscalQr = Boolean(r.fiscalQrUrl && String(r.fiscalQrUrl).trim() !== '' && r.fiscalQrUrl !== '—');
    const isFiscal = Boolean(hasFiscalSign || hasFiscalQr || r.fiscalStatus === 'FISCALIZED' || r.hasQr === true);
    const dateFormatted = r.createdAt ? `${r.createdAt.slice(0, 10).split('-').reverse().join('.')}, ${r.createdAt.slice(11, 16)}` : '—';
    const qrValue = r.fiscalQrUrl || (isFiscal ? buildQrPayload(r) : null);
    return {
      no: r.receiptNumber || r.saleId || '—',
      when: dateFormatted,
      items: (r.items || []).map((i) => {
        const qty = Number(i.quantity ?? 1);
        const price = Number(i.unitPrice ?? i.price ?? 0);
        const total = i.lineTotal != null ? Number(i.lineTotal) : (i.total != null ? Number(i.total) : qty * price);
        return {
          name: i.productName || i.name || 'Tovar',
          line: `${formatNumber(qty)} × ${formatNumber(price)}`,
          total: formatNumber(total),
        };
      }),
      subtotal: formatNumber(r.subtotal ?? r.totalAmount),
      tax: formatNumber(r.taxTotal ?? 0),
      total: formatNumber(r.totalAmount),
      payMethod: r.paymentMethod === 'CASH' ? 'Naqd pul' : (r.paymentMethod === 'CARD' ? 'Plastik karta' : (r.paymentMethod === 'CASHLESS' ? 'Karta / Naqdsiz' : (r.paymentMethod || 'Naqd pul'))),
      cashierName: r.cashierName || 'Kassir',
      storeName: r.storeName,
      isFiscal,
      fiscalSign: r.fiscalSign || '—',
      fiscalSeq: r.fiscalReceiptSeq || '—',
      fiscalTerminalId: r.fiscalTerminalId || '—',
      fiscalQrUrl: r.fiscalQrUrl || null,
      qrValue,
    };
  }
  const isFiscal = Boolean(r[7]);
  const dateFormatted = typeof r[1] === 'string' && r[1].includes('-') ? r[1].split('-').reverse().join('.') : r[1];
  const qrValue = isFiscal
    ? buildQrPayload({
        fiscalTerminalId: r[11],
        fiscalReceiptSeq: r[9],
        fiscalSign: r[8],
        createdAt: r[1] ? `${r[1]}T${r[2] || '00:00'}:00Z` : undefined,
      })
    : null;
  return {
    no: r[0],
    when: `${dateFormatted}, ${r[2]}`,
    items: (r[10] || []).map((i) => ({
      name: i[0],
      line: `${formatNumber(i[1])} × ${formatNumber(i[2])}`,
      total: formatNumber(i[1] * i[2]),
    })),
    subtotal: formatNumber(r[3]),
    tax: formatNumber(r[4]),
    total: formatNumber(r[5]),
    payMethod: r[6] === 'CASH' ? 'Naqd pul' : 'Plastik karta',
    isFiscal,
    fiscalSign: r[8] || '—',
    fiscalSeq: r[9] || '—',
    fiscalTerminalId: r[11] || '—',
    fiscalQrUrl: null,
    qrValue,
  };
}
