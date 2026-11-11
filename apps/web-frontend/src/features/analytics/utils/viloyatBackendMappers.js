export function mapBackendProductList(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const topMax = Math.max(...items.map((p) => Number(p.totalAmount || p.amount || 0)), 1);
  return items.slice(0, 5).map((p) => {
    const qty = Number(p.quantity ?? p.qty ?? 0);
    const amount = Number(p.totalAmount ?? p.amount ?? 0);
    const unitPrice = qty > 0 ? amount / qty : 0;
    return {
      name: p.name || p.productName || '—',
      company: p.companyName || p.company || '—',
      qty,
      amount,
      barPercent: Math.max(3, (amount / topMax) * 100),
      isSuspiciousPrice: qty > 0 && amount / qty < 100,
      unitPrice: Math.round(unitPrice),
    };
  });
}

export function mapBackendDailyBars(days = []) {
  if (!Array.isArray(days) || days.length === 0) return [];
  const maxDay = Math.max(...days.map((d) => Number(d.totalTurnover || 0)), 1);
  const monthNames = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  return days.map((d) => {
    const val = Number(d.totalTurnover || 0);
    const date = String(d.date || '').slice(0, 10);
    const parts = date.split('-');
    const dayNum = Number(parts[2] || 0);
    const monthIdx = Math.max(0, Number(parts[1] || 1) - 1);
    const dayLabel = `${dayNum}-${monthNames[monthIdx] || ''}`;
    const tip = val
      ? `${dayLabel}: ${val.toLocaleString('ru-RU')} so‘m · ${Number(d.receiptsCount || 0)} chek`
      : `${dayLabel}: savdo yo‘q`;
    return {
      tip,
      heightPercent: val ? Math.max(6, (val / maxDay) * 100) : 4,
      val,
      date,
    };
  });
}
