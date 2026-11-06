import { styleDishLine, styleLine } from '../../shared/printProfile/applyPrintProfile';
import { fieldStyle } from '../../shared/printProfile/printProfileDefaults';

/** Meta / title row with print-profile bold & size. Null when field is off. */
export function styleSlipFieldLine(text, profile, slipType, fieldKey) {
  const style = fieldStyle(profile, slipType, fieldKey);
  if (!style.on) return null;
  const body = String(text ?? '');
  if (!body) return body;
  return styleLine(body, style);
}

/**
 * Dish/item rows: apply items bold/size. Keep separators, category marks, indented notes plain.
 */
export function styleSlipItemRows(rows, profile, slipType) {
  const out = [];
  for (const row of rows || []) {
    const raw = String(row ?? '');
    if (!raw || raw === '---' || raw.startsWith('≫') || raw.startsWith('   ') || raw.startsWith('-')) {
      out.push(raw);
      continue;
    }
    const styled = styleDishLine(raw, profile, slipType);
    if (styled != null) out.push(styled);
  }
  return out;
}

/** Totals / money rows: bold or large when set; otherwise leave plain. */
export function styleSlipTotalsRow(row, profile, slipType) {
  const style = fieldStyle(profile, slipType, 'totals');
  if (!style.on) return null;
  if (style.bold || style.size === 'lg') return styleLine(String(row ?? ''), style);
  return String(row ?? '');
}
