/** Build ESC/POS text lines from immutable print_job.payload snapshot. */

function payloadToTicketLines(payload) {
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  if (!data || !Array.isArray(data.items)) {
    throw new Error('print_payload_invalid');
  }
  const lines = [];
  if (data.tableLabel) lines.push(`Стол: ${data.tableLabel}`);
  if (data.station) lines.push(`Станция: ${data.station}`);
  if (data.categoryName) lines.push(`Категория: ${data.categoryName}`);
  if (lines.length) lines.push('---');
  for (const item of data.items) {
    const qty = Number(item.qty) || 0;
    const portion = item.portionText ? ` (${item.portionText})` : '';
    lines.push(`${qty}× ${item.name || ''}${portion}`);
    if (Array.isArray(item.modifiers) && item.modifiers.length) {
      lines.push(`   + ${item.modifiers.join(', ')}`);
    }
    if (item.note) lines.push(`   * ${item.note}`);
  }
  return {
    title: data.kind === 'GUEST_BILL' ? 'СЧЁТ' : 'КУНЯ',
    printerName: String(data.printerName || '').trim(),
    lines,
  };
}

module.exports = { payloadToTicketLines };
