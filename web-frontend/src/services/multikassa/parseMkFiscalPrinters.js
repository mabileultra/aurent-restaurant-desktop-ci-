/** Разбор GET /api/v1/devices/printers MK Fiscal 1.2.x. */

function printerLabel(item) {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  return String(
    item.PrinterName ??
      item.printerName ??
      item.name ??
      item.Name ??
      item.title ??
      item.Title ??
      item.id ??
      item.Id ??
      '',
  ).trim();
}

export function isDummyMkPrinterName(name) {
  const n = String(name || '').trim();
  if (!n) return true;
  if (/не печатать/i.test(n)) return true;
  return /^(none|null|-)$/i.test(n);
}

function looksLikePrinterArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const first = arr[0];
  if (typeof first === 'string') return true;
  if (first && typeof first === 'object') {
    return Boolean(
      printerLabel(first) ||
        'PrinterName' in first ||
        'printerName' in first ||
        'IsOnline' in first ||
        'isOnline' in first,
    );
  }
  return false;
}

function collectPrinterArrays(raw, depth = 0) {
  if (raw == null || depth > 5) return [];
  if (looksLikePrinterArray(raw)) return [raw];
  if (typeof raw !== 'object') return [];
  const found = [];
  if (looksLikePrinterArray(raw.printers)) found.push(raw.printers);
  if (looksLikePrinterArray(raw.Printers)) found.push(raw.Printers);
  for (const value of Object.values(raw)) {
    if (value && typeof value === 'object') {
      found.push(...collectPrinterArrays(value, depth + 1));
    }
  }
  return found;
}

function pickStringField(raw, keys, depth = 0) {
  if (raw == null || typeof raw !== 'object' || depth > 5) return '';
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  for (const value of Object.values(raw)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = pickStringField(value, keys, depth + 1);
      if (nested) return nested;
    }
  }
  return '';
}

export function parseMkFiscalPrinters(raw) {
  const arrays = collectPrinterArrays(raw);
  const printers = arrays.find((arr) => arr.length > 0) || [];
  const labels = printers.map(printerLabel).filter(Boolean);
  const selected = pickStringField(raw, ['selectedPrinter', 'SelectedPrinter', 'selected']);
  const paperWidthRaw = pickStringField(raw, ['selectedPaperWidth', 'SelectedPaperWidth', 'paperWidth']);
  const paperWidth = Number(paperWidthRaw);
  return {
    printers,
    labels,
    selected,
    selectedValid: Boolean(selected) && !isDummyMkPrinterName(selected),
    paperWidth: Number.isFinite(paperWidth) && paperWidth > 0 ? paperWidth : 80,
  };
}

export function pickMkFiscalPrinterToSelect(parsed) {
  const labels = parsed?.labels || [];
  const selected = parsed?.selected || '';
  if (selected && !isDummyMkPrinterName(selected)) return selected;

  const thermal = labels.find(
    (name) => !isDummyMkPrinterName(name) && /xp-?\d|pos-?\d|thermal|receipt|чеков/i.test(name),
  );
  if (thermal) return thermal;

  const pdf = labels.find((name) => /print to pdf/i.test(name));
  if (pdf) return pdf;

  const online = (parsed?.printers || []).find((item) => {
    const name = printerLabel(item);
    if (!name || isDummyMkPrinterName(name)) return false;
    return item?.IsOnline === true || item?.isOnline === true;
  });
  if (online) return printerLabel(online);

  return labels.find((name) => !isDummyMkPrinterName(name)) || '';
}
