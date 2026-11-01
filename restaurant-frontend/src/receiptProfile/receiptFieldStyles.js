import { RECEIPT_FIELD_DEFS } from './receiptFieldCatalog';

export const RECEIPT_ALIGN = Object.freeze(['left', 'center', 'right']);

export const RECEIPT_SIZE_PCT_MIN = 50;
export const RECEIPT_SIZE_PCT_MAX = 200;
export const RECEIPT_BOLD_PCT_MIN = 0;
export const RECEIPT_BOLD_PCT_MAX = 100;

const LEGACY_SIZE = Object.freeze({ sm: 80, md: 100, lg: 130 });

export function clampSizePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.min(RECEIPT_SIZE_PCT_MAX, Math.max(RECEIPT_SIZE_PCT_MIN, Math.round(n)));
}

export function clampBoldPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(RECEIPT_BOLD_PCT_MAX, Math.max(RECEIPT_BOLD_PCT_MIN, Math.round(n)));
}

export function normalizeAlign(value) {
  return RECEIPT_ALIGN.includes(value) ? value : 'left';
}

/** Legacy sm/md/lg + boolean bold → numeric. */
export function coerceReceiptFieldStyle(row) {
  if (!row || typeof row !== 'object') {
    return defaultReceiptFieldStyle();
  }
  let sizePct = 100;
  if (typeof row.sizePct === 'number' || typeof row.sizePct === 'string') {
    sizePct = clampSizePct(row.sizePct);
  } else if (typeof row.size === 'string' && LEGACY_SIZE[row.size] != null) {
    sizePct = LEGACY_SIZE[row.size];
  } else if (typeof row.size === 'number') {
    sizePct = clampSizePct(row.size);
  }

  let boldPct = 0;
  if (typeof row.boldPct === 'number' || typeof row.boldPct === 'string') {
    boldPct = clampBoldPct(row.boldPct);
  } else if (row.bold === true || row.bold === 1) {
    boldPct = 100;
  } else if (typeof row.bold === 'number') {
    boldPct = clampBoldPct(row.bold);
  }

  return {
    sizePct,
    boldPct,
    align: normalizeAlign(row.align),
  };
}

export function defaultReceiptFieldStyle() {
  return { sizePct: 100, boldPct: 0, align: 'left' };
}

export function defaultReceiptFieldStyles() {
  return Object.fromEntries(
    RECEIPT_FIELD_DEFS.map((d) => {
      const base = defaultReceiptFieldStyle();
      if (d.defaultAlign) base.align = d.defaultAlign;
      return [d.key, base];
    }),
  );
}

export function mergeReceiptFieldStyles(saved) {
  const base = defaultReceiptFieldStyles();
  if (!saved || typeof saved !== 'object') return base;
  for (const d of RECEIPT_FIELD_DEFS) {
    if (saved[d.key] == null) continue;
    base[d.key] = coerceReceiptFieldStyle(saved[d.key]);
    if (!saved[d.key]?.align && d.defaultAlign) {
      base[d.key].align = d.defaultAlign;
    }
  }
  return base;
}

export function fieldControls(key) {
  const def = RECEIPT_FIELD_DEFS.find((d) => d.key === key);
  return def?.controls || { size: true, bold: true, align: true };
}

export function receiptFieldStyleClass(style) {
  const align = normalizeAlign(style?.align);
  return ['rst-fiscal-field', `rst-fiscal-field--align-${align}`].join(' ');
}

/** Inline CSS vars for preview (numeric size / weight). */
export function receiptFieldStyleVars(style) {
  const st = coerceReceiptFieldStyle(style);
  return {
    '--rst-fs-size': `${st.sizePct}%`,
    '--rst-fs-weight': String(400 + Math.round((st.boldPct / 100) * 500)),
  };
}

export function receiptFieldStyleProps(style) {
  return {
    className: receiptFieldStyleClass(style),
    style: receiptFieldStyleVars(style),
  };
}
