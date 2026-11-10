import { resolveRollingCardWindows } from './korxonaCardWindows';
import { formatNumber, formatPercent, calculateDonutArc } from './korxonaDetailUtils';
import { MAKON_MOBILE_CARDS } from '../data/makonMobileMockData';

export function resolveCompanyCards({ numId, turnover, delta, apiDetail }) {
  if (numId === 103 && !apiDetail) {
    return MAKON_MOBILE_CARDS;
  }

  const t = Number(turnover || apiDetail?.totalTurnover || 0);
  const win = resolveRollingCardWindows(apiDetail?.days);
  const weekVal = apiDetail?.days ? win.weekVal : Math.round(t * 0.15);
  const weekDelta = apiDetail?.days ? win.weekDelta : delta;
  const weekSub = win.weekFrom && win.weekTo
    ? `${win.weekFrom} – ${win.weekTo}`
    : 'Oxirgi 7 kun';
  const dayVal = apiDetail?.days ? win.dayVal : 0;
  const dayDate = win.dayDate;

  return [
    { label: 'Umumiy aylanma', sub: 'Butun davr', v: t, badge: 'Birinchi savdo: 20-oktabr', badgeType: 'mute' },
    { label: '1 oylik aylanma', sub: 'Oxirgi 30 kun · 10-okt – 8-noy', v: t, badge: '30 kunlik', badgeType: 'info' },
    {
      label: 'Haftalik',
      sub: weekSub,
      v: weekVal,
      badge: weekDelta != null ? `${weekDelta >= 0 ? '▲' : '▼'} ${Math.abs(weekDelta)}%` : '7 kunlik',
      badgeType: weekDelta != null && weekDelta < 0 ? 'down' : 'up',
    },
    {
      label: 'Kunlik',
      sub: dayDate || 'Bugun',
      v: dayVal,
      badge: dayDate || 'Savdo yo‘q',
      badgeType: 'mute',
    },
  ];
}

export function resolveCompanyDonuts({ numId, turnover, fiscalTurnover, nonFiscalTurnover, apiDetail }) {
  if (numId === 103 && !apiDetail) {
    return [
      {
        label: 'Fiskal bilan urilgan',
        color: '#0E7C4F',
        pct: formatPercent(99.2),
        amount: `${formatNumber(508339000)} so‘m`,
        hint: '41 ta chek · QR-kod bilan',
        dash: calculateDonutArc(99.2),
        aria: 'Fiskal bilan urilgan: 99,2%, 508 339 000 so‘m',
      },
      {
        label: 'Fiskalsiz',
        color: '#EF4444',
        pct: formatPercent(0.8),
        amount: `${formatNumber(4100000)} so‘m`,
        hint: '2 ta chek · soliqqa yuborilmagan',
        dash: calculateDonutArc(0.8),
        aria: 'Fiskalsiz: 0,8%, 4 100 000 so‘m',
      },
    ];
  }

  const t = Number(turnover || apiDetail?.totalTurnover || 0);
  const f = fiscalTurnover != null ? Number(fiscalTurnover) : Number(apiDetail?.fiscalTurnover || 0);
  const nf = nonFiscalTurnover != null ? Number(nonFiscalTurnover) : Number(apiDetail?.nonFiscalTurnover || Math.max(0, t - f));
  const total = f + nf > 0 ? f + nf : t;
  const fPct = total > 0 ? (f / total) * 100 : 0;
  const nfPct = Math.max(0, 100 - fPct);
  const fiscalReceipts = Number(apiDetail?.fiscalReceiptsCount ?? apiDetail?.fiscalReceiptCount ?? 0);
  const nonFiscalReceipts = Number(apiDetail?.nonFiscalReceiptsCount ?? apiDetail?.nonFiscalReceiptCount ?? 0);

  return [
    {
      label: 'Fiskal bilan urilgan',
      color: '#0E7C4F',
      pct: formatPercent(fPct),
      amount: `${formatNumber(f)} so‘m`,
      hint: fiscalReceipts > 0 ? `${fiscalReceipts} ta chek · QR-kod bilan` : 'QR-kod bilan',
      dash: calculateDonutArc(fPct),
      aria: `Fiskal bilan urilgan: ${formatPercent(fPct)}, ${formatNumber(f)} so‘m`,
    },
    {
      label: 'Fiskalsiz',
      color: '#EF4444',
      pct: formatPercent(nfPct),
      amount: `${formatNumber(nf)} so‘m`,
      hint: nonFiscalReceipts > 0 ? `${nonFiscalReceipts} ta chek · soliqqa yuborilmagan` : 'Soliqqa yuborilmagan',
      dash: calculateDonutArc(nfPct),
      aria: `Fiskalsiz: ${formatPercent(nfPct)}, ${formatNumber(nf)} so‘m`,
    },
  ];
}
