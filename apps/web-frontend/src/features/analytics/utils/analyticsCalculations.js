export function calculateTop5Share(companies = [], fallbackTotal = 0) {
  if (!Array.isArray(companies) || companies.length === 0) {
    return { topAmount: 0, totalAmount: fallbackTotal, sharePct: 0, topCompanies: [] };
  }

  const sorted = [...companies].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
  const top5 = sorted.slice(0, 5);
  const topAmount = top5.reduce((sum, c) => sum + Number(c.totalTurnover || 0), 0);
  const totalAmount = fallbackTotal > 0
    ? fallbackTotal
    : sorted.reduce((sum, c) => sum + Number(c.totalTurnover || 0), 0);

  const sharePct = totalAmount > 0 ? (topAmount / totalAmount) * 100 : 0;
  return { topAmount, totalAmount, sharePct: Number(sharePct.toFixed(1)), topCompanies: top5 };
}

export function calculateFiscalDistribution(companies = []) {
  const buckets = [
    { label: '0–20%', min: 0, max: 20, count: 0 },
    { label: '20–40%', min: 20, max: 40, count: 0 },
    { label: '40–60%', min: 40, max: 60, count: 0 },
    { label: '60–80%', min: 60, max: 80, count: 0 },
    { label: '80–100%', min: 80, max: 100, count: 0 },
  ];

  let zeroFiscalCount = 0;
  let highFiscalCount = 0;
  let sellingCount = 0;

  companies.forEach((c) => {
    const total = Number(c.totalTurnover || 0);
    const fiscal = Number(c.fiscalTurnover || 0);
    if (total <= 0) return;

    sellingCount += 1;
    const share = (fiscal / total) * 100;

    if (fiscal === 0 || share === 0) {
      zeroFiscalCount += 1;
    }
    if (share >= 80) {
      highFiscalCount += 1;
    }

    if (share <= 20) buckets[0].count += 1;
    else if (share <= 40) buckets[1].count += 1;
    else if (share <= 60) buckets[2].count += 1;
    else if (share <= 80) buckets[3].count += 1;
    else buckets[4].count += 1;
  });

  return { buckets, zeroFiscalCount, highFiscalCount, sellingCount };
}

export function calculateDailyMetrics(days = []) {
  if (!Array.isArray(days) || days.length === 0) {
    return { avgDaily: 0, peakDay: null, activeDays: 0, totalDays: 0 };
  }

  let totalSum = 0;
  let activeDays = 0;
  let peakDay = null;

  days.forEach((day) => {
    const sum = Number(day.totalTurnover || day.fiscalTurnover || 0);
    totalSum += sum;
    if (sum > 0) activeDays += 1;
    if (!peakDay || sum > peakDay.amount) {
      peakDay = { date: day.date, amount: sum };
    }
  });

  const avgDaily = days.length > 0 ? totalSum / days.length : 0;
  return { avgDaily, peakDay, activeDays, totalDays: days.length };
}

export function calculateAttentionItems(companies = []) {
  const notConnectedSelling = companies.filter(
    (c) => !c.connected && Number(c.totalTurnover || c.nonFiscalTurnover || 0) > 0,
  );
  const connectedNoReceipts = companies.filter(
    (c) => c.connected && Number(c.totalTurnover || c.fiscalTurnover || 0) === 0,
  );
  const missingRegion = companies.filter(
    (c) => !c.regionCode || c.regionCode === '0' || c.regionNameRu === 'Ko‘rsatilmagan' || c.regionNameUz === 'Ko‘rsatilmagan',
  );

  return {
    notConnectedSelling: {
      count: notConnectedSelling.length,
      amount: notConnectedSelling.reduce((s, c) => s + Number(c.totalTurnover || c.nonFiscalTurnover || 0), 0),
      firms: notConnectedSelling.slice(0, 3),
    },
    connectedNoReceipts: {
      count: connectedNoReceipts.length,
      firms: connectedNoReceipts.slice(0, 3),
    },
    missingRegion: {
      count: missingRegion.length,
      amount: missingRegion.reduce((s, c) => s + Number(c.totalTurnover || 0), 0),
      firms: missingRegion.slice(0, 3),
    },
  };
}

export function calculateResultsTotals(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { fiscalTurnover: 0, nonFiscalTurnover: 0, totalTurnover: 0, fiscalPct: 0, nonFiscalPct: 0 };
  }
  let fiscalTurnover = 0;
  let nonFiscalTurnover = 0;
  let totalTurnover = 0;
  rows.forEach((r) => {
    fiscalTurnover += Number(r.fiscalTurnover || 0);
    nonFiscalTurnover += Number(r.nonFiscalTurnover || 0);
    totalTurnover += Number(r.totalTurnover || 0);
  });
  if (totalTurnover === 0) {
    totalTurnover = fiscalTurnover + nonFiscalTurnover;
  }
  const fiscalPct = totalTurnover > 0 ? Math.min(100, (fiscalTurnover / totalTurnover) * 100) : 0;
  const nonFiscalPct = totalTurnover > 0 ? Math.min(100, (nonFiscalTurnover / totalTurnover) * 100) : 0;
  return { fiscalTurnover, nonFiscalTurnover, totalTurnover, fiscalPct, nonFiscalPct };
}

