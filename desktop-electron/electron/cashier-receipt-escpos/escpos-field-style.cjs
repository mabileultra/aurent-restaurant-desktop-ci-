/**
 * Apply company receiptFieldStyles (sizePct / boldPct / align) on ThermalPrinter.
 * Legacy sm|md|lg and boolean bold still accepted.
 */

const LEGACY_SIZE = { sm: 80, md: 100, lg: 130 };

function clampSizePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.min(200, Math.max(50, Math.round(n)));
}

function clampBoldPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function resolveFieldStyle(styles, key) {
  const row = styles && typeof styles === 'object' ? styles[key] : null;
  if (!row || typeof row !== 'object') {
    return { sizePct: 100, boldPct: 0, align: 'left' };
  }

  let sizePct = 100;
  if (row.sizePct != null) sizePct = clampSizePct(row.sizePct);
  else if (typeof row.size === 'string' && LEGACY_SIZE[row.size] != null) sizePct = LEGACY_SIZE[row.size];
  else if (typeof row.size === 'number') sizePct = clampSizePct(row.size);

  let boldPct = 0;
  if (row.boldPct != null) boldPct = clampBoldPct(row.boldPct);
  else if (typeof row.bold === 'number') boldPct = clampBoldPct(row.bold);
  else if (row.bold === true) boldPct = 100;

  const align = row.align === 'center' || row.align === 'right' ? row.align : 'left';
  return { sizePct, boldPct, align };
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {Record<string, object>|undefined} styles
 * @param {string} key
 * @param {() => void} printFn
 */
function withFieldStyle(printer, styles, key, printFn) {
  const st = resolveFieldStyle(styles, key);
  const large = st.sizePct >= 125;
  const small = st.sizePct <= 85;
  const wantBold = st.boldPct >= 40 || large;

  if (st.align === 'center' && typeof printer.alignCenter === 'function') printer.alignCenter();
  else if (st.align === 'right' && typeof printer.alignRight === 'function') printer.alignRight();
  else if (typeof printer.alignLeft === 'function') printer.alignLeft();

  if (wantBold && typeof printer.bold === 'function') printer.bold(true);
  if (large && typeof printer.setTextDoubleHeight === 'function') printer.setTextDoubleHeight();
  if (small && typeof printer.setTypeFontB === 'function') printer.setTypeFontB();

  try {
    printFn(st);
  } finally {
    if (small && typeof printer.setTypeFontA === 'function') printer.setTypeFontA();
    if (large && typeof printer.setTextNormal === 'function') printer.setTextNormal();
    if (wantBold && typeof printer.bold === 'function') printer.bold(false);
    if (typeof printer.alignLeft === 'function') printer.alignLeft();
  }
}

module.exports = {
  resolveFieldStyle,
  withFieldStyle,
};
