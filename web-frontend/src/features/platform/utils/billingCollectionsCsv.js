function csvCell(value) {
  const s = value == null ? '' : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCollectionsCsv(rows, { t, formatDate }) {
  const k = (key) => t(`platform.billing.collections.${key}`);
  const header = [
    'ID',
    k('colCompany'),
    k('colPlan'),
    k('colMonthly'),
    k('colBalance'),
    k('colNext'),
    k('colStatus'),
    k('colMethod'),
    k('daysOverdueShort'),
  ];
  const lines = rows.map((row) => {
    const b = row.billing;
    return [
      b.companyId,
      b.companyName,
      b.planName || '',
      Number(b.monthlyTotal || 0),
      Number(b.balance || 0),
      formatDate(b.nextChargeAt),
      k(`states.${row.paymentState}`),
      row.lastPaymentMethod ? k(`methods.${row.lastPaymentMethod}`) : '',
      row.daysOverdue || '',
    ];
  });
  return [header, ...lines].map((line) => line.map(csvCell).join(';')).join('\n');
}

export function downloadCollectionsCsv(rows, ctx) {
  const blob = new Blob([`\uFEFF${buildCollectionsCsv(rows, ctx)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `billing-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
