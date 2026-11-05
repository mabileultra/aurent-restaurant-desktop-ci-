import { fmtDeltaBadge, fmtPercent, sanitizeText } from './analyticsFormat';

export function buildReportPayload(type, { kpi, totals, topRegions, companies = [], receipts = [] }) {
  if (type === 'regions') {
    const headers = ['#', 'Hudud', 'Korxonalar', 'Ulangan', 'Fiskal aylanma', 'Nofiskal aylanma', 'Umumiy aylanma', 'Fiskal ulush', 'O‘zgarish'];
    const rows = topRegions.map((r, i) => [
      i + 1,
      sanitizeText(r.nameUz || r.nameRu || 'Hudud'),
      r.enterprises || 0,
      r.connected || 0,
      r.fiscalTurnover || 0,
      r.nonFiscalTurnover || 0,
      r.totalTurnover || 0,
      fmtPercent(r.fiscalSharePct),
      fmtDeltaBadge(r.turnoverDeltaPct).text,
    ]);
    return { title: 'Hududlar bo‘yicha aylanma', headers, rows };
  }

  if (type === 'companies') {
    const headers = ['#', 'Firma nomi', 'STIR', 'Fiskal holat', 'Fiskal aylanma', 'Nofiskal aylanma', 'Umumiy aylanma', 'Fiskal ulush'];
    const rows = companies.map((c, i) => {
      const tot = Number(c.totalTurnover || 0);
      const fisc = Number(c.fiscalTurnover || 0);
      const share = tot > 0 ? (fisc / tot) * 100 : 0;
      return [
        i + 1,
        sanitizeText(c.name),
        c.tin || '',
        c.connected ? 'Ulangan' : 'Ulanmagan',
        fisc,
        Number(c.nonFiscalTurnover || 0),
        tot,
        fmtPercent(share),
      ];
    });
    return { title: 'Korxonalar bo‘yicha aylanma', headers, rows };
  }

  if (type === 'fiscal_share') {
    const headers = ['Ko‘rsatkich', 'Aylanma (so‘m)', 'Ulush'];
    const rows = [
      ['Fiskal aylanma', totals?.fiscalTurnover || 0, fmtPercent(totals?.fiscalPct)],
      ['Nofiskal aylanma', totals?.nonFiscalTurnover || 0, fmtPercent(totals?.nonFiscalPct)],
      ['Jami aylanma', totals?.totalTurnover || 0, '100%'],
    ];
    return { title: 'Fiskal va nofiskal aylanma', headers, rows };
  }

  if (type === 'connection') {
    const headers = ['Ko‘rsatkich', 'Soni', 'Ulushi'];
    const rows = [
      ['Jami korxonalar', kpi?.totalEnterprises || 0, '100%'],
      ['Fiskal tizimga ulangan', kpi?.connected || 0, fmtPercent(kpi?.connectedSharePct)],
      ['Ulanmagan korxonalar', kpi?.notConnected || 0, fmtPercent(kpi?.notConnectedSharePct)],
      ['Yangi ulanishlar', kpi?.newConnections || 0, '—'],
      ['Ulanishdagi xatoliklar', kpi?.connectionErrors || 0, '—'],
    ];
    return { title: 'Fiskal tizimga ulanish hisoboti', headers, rows };
  }

  if (type === 'activity') {
    const headers = ['#', 'Firma nomi', 'STIR', 'Aylanma (so‘m)', 'Holati'];
    const rows = companies.map((c, i) => [
      i + 1,
      sanitizeText(c.name),
      c.tin || '',
      Number(c.totalTurnover || 0),
      Number(c.totalTurnover || 0) > 0 ? 'Savdo bor' : 'Savdo yo‘q',
    ]);
    return { title: 'Korxonalar faolligi', headers, rows };
  }

  if (type === 'receipts') {
    const headers = ['Chek raqami', 'Sana', 'Summa (so‘m)', 'QR holati'];
    const rows = receipts.map((r) => [
      r.receiptNumber || r.saleId || 'Chek',
      r.createdAt || r.date || '—',
      Number(r.totalAmount || r.amount || 0),
      (r.hasQr || r.fiscalStatus === 'FISCAL') ? 'QR bilan' : 'QR’siz',
    ]);
    return { title: 'Cheklar bo‘yicha hisobot', headers, rows };
  }

  // Default: 'republic'
  const headers = ['Ko‘rsatkich', 'Qiymat', 'Izoh'];
  const rows = [
    ['Jami korxonalar', kpi?.totalEnterprises || 0, 'Ro‘yxatdagi barcha subyektlar'],
    ['Ulangan korxonalar', kpi?.connected || 0, `${fmtPercent(kpi?.connectedSharePct)} ulush`],
    ['Ulanmagan korxonalar', kpi?.notConnected || 0, `${fmtPercent(kpi?.notConnectedSharePct)} ulush`],
    ['Umumiy aylanma', totals?.totalTurnover || 0, fmtDeltaBadge(kpi?.totalTurnoverDeltaPct).text],
    ['Fiskal aylanma', totals?.fiscalTurnover || 0, `${fmtPercent(totals?.fiscalPct)} ulush`],
    ['Nofiskal aylanma', totals?.nonFiscalTurnover || 0, `${fmtPercent(totals?.nonFiscalPct)} ulush`],
    ['Yangi ulanishlar', kpi?.newConnections || 0, fmtDeltaBadge(kpi?.newConnectionsDeltaPct).text],
  ];
  return { title: 'Respublika bo‘yicha umumiy aylanma', headers, rows };
}
