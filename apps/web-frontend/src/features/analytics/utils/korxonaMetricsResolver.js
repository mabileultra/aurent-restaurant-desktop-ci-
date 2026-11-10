import { formatNumber, formatPercent, calculateDonutArc, parseDayLabels } from './korxonaDetailUtils';
import { MAKON_MOBILE_CARDS } from '../data/makonMobileMockData';

export function resolveCompanyCards({ numId, turnover, delta, apiDetail }) {
  if (numId === 103 && !apiDetail) {
    return MAKON_MOBILE_CARDS;
  }

  const t = Number(turnover || apiDetail?.totalTurnover || 0);
  const weeks = apiDetail?.weeks;
  const lastWeek = Array.isArray(weeks) && weeks.length > 0 ? weeks[weeks.length - 1] : null;
  const weekVal = lastWeek ? Number(lastWeek.totalTurnover || 0) : Math.round(t * 0.15);
  const weekDelta = lastWeek?.deltaPct != null ? Number(lastWeek.deltaPct) : delta;

  const rawDays = apiDetail?.days;
  const sortedDays = Array.isArray(rawDays) ? [...rawDays].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const activeDays = sortedDays.filter((d) => Number(d.totalTurnover || 0) > 0);
  const oldestActive = activeDays[0];
  const latestActive = activeDays[activeDays.length - 1];

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayEntry = sortedDays.find((d) => d.date === todayIso);
  const todayVal = Number(todayEntry?.totalTurnover || 0);

  let weekSub = 'Oxirgi 7 kun';
  let weekBadge = weekDelta != null ? `${weekDelta >= 0 ? '▲' : '▼'} ${Math.abs(weekDelta)}%` : '7 kunlik';
  let weekBadgeType = weekDelta != null && weekDelta < 0 ? 'down' : 'up';
  if (lastWeek?.weekFrom) {
    const fStr = parseDayLabels(lastWeek.weekFrom).short;
    const tStr = parseDayLabels(lastWeek.weekTo).short;
    if (lastWeek.weekFrom === lastWeek.weekTo) {
      weekSub = `Joriy hafta · ${fStr}`;
      if (weekVal === 0) { weekBadge = 'Yangi hafta'; weekBadgeType = 'mute'; }
    } else {
      weekSub = `${fStr} – ${tStr}`;
    }
  }

  const daySub = `Bugun · ${parseDayLabels(todayIso).short || todayIso}`;
  const dayBadge = todayVal > 0
    ? 'Bugungi savdo'
    : (latestActive ? `Oxirgi savdo: ${parseDayLabels(latestActive.date).short}` : (apiDetail ? 'Savdo yo‘q' : 'Oxirgi savdo: 2-noyabr'));
  const dayBadgeType = todayVal > 0 ? 'up' : 'mute';

  const periodSub = apiDetail?.from && apiDetail?.to
    ? `Oxirgi 30 kun · ${parseDayLabels(apiDetail.from).short} – ${parseDayLabels(apiDetail.to).short}`
    : 'Oxirgi 30 kun';
  const firstSaleBadge = oldestActive
    ? `Ilk savdo: ${parseDayLabels(oldestActive.date).short}`
    : (apiDetail ? '30 kunlik' : 'Birinchi savdo: 20-oktabr');
  const monthBadge = activeDays.length > 0 ? `${activeDays.length} kun savdo` : '30 kunlik';

  return [
    { label: 'Umumiy aylanma', sub: 'Oxirgi 30 kun', v: t, badge: firstSaleBadge, badgeType: 'mute' },
    { label: '1 oylik aylanma', sub: periodSub, v: t, badge: monthBadge, badgeType: 'info' },
    { label: 'Haftalik', sub: weekSub, v: weekVal, badge: weekBadge, badgeType: weekBadgeType },
    { label: 'Kunlik', sub: daySub, v: todayVal, badge: dayBadge, badgeType: dayBadgeType },
  ];
}

export function resolveCompanyDonuts({ numId, turnover, fiscalTurnover, nonFiscalTurnover, apiDetail }) {
  const isMock103 = numId === 103 && !apiDetail;
  const t = isMock103 ? 512439000 : Number(turnover || apiDetail?.totalTurnover || 0);
  const f = isMock103 ? 508339000 : (fiscalTurnover != null ? Number(fiscalTurnover) : Number(apiDetail?.fiscalTurnover || 0));
  const nf = isMock103 ? 4100000 : (nonFiscalTurnover != null ? Number(nonFiscalTurnover) : Number(apiDetail?.nonFiscalTurnover || Math.max(0, t - f)));
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
      hint: fiscalReceipts > 0 ? `${fiscalReceipts} ta chek · QR-kod bilan` : (isMock103 ? '41 ta chek · QR-kod bilan' : 'QR-kod bilan'),
      dash: calculateDonutArc(fPct),
      aria: `Fiskal bilan urilgan: ${formatPercent(fPct)}, ${formatNumber(f)} so‘m`,
    },
    {
      label: 'Fiskalsiz',
      color: '#EF4444',
      pct: formatPercent(nfPct),
      amount: `${formatNumber(nf)} so‘m`,
      hint: nonFiscalReceipts > 0 ? `${nonFiscalReceipts} ta chek · soliqqa yuborilmagan` : (isMock103 ? '2 ta chek · soliqqa yuborilmagan' : 'Soliqqa yuborilmagan'),
      dash: calculateDonutArc(nfPct),
      aria: `Fiskalsiz: ${formatPercent(nfPct)}, ${formatNumber(nf)} so‘m`,
    },
  ];
}
