import { styleDishLine, styleLine } from '../../shared/printProfile/applyPrintProfile';
import { fieldStyle } from '../../shared/printProfile/printProfileDefaults';

export const GUEST_SLIP = 'GUEST_BILL';

export function pushProfileLine(lines, text, profile, fieldKey) {
  const body = String(text || '').trim();
  if (!body) return;
  const style = fieldStyle(profile, GUEST_SLIP, fieldKey);
  if (!style.on) return;
  lines.push(styleLine(body, style));
}

export function styleTotalsRow(row, profile) {
  const style = fieldStyle(profile, GUEST_SLIP, 'totals');
  if (!style.on) return null;
  if (style.bold || style.size === 'lg') return styleLine(row, style);
  return row;
}

export function styleGuestItemRows(rows, profile) {
  const out = [];
  for (const row of rows || []) {
    const styled = styleDishLine(row, profile, GUEST_SLIP);
    if (styled != null) out.push(styled);
  }
  return out;
}

export { fieldStyle, styleLine };
