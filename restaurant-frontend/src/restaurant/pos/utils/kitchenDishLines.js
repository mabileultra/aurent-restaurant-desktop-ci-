/**
 * Kitchen / cancel slip dish lines. Prices only when slip field `totals` is on.
 */
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { fieldStyle } from '../../shared/printProfile/printProfileDefaults';
import { styleDishLine } from '../../shared/printProfile/applyPrintProfile';
import { moneyRow, padRow, qtyNameRow, RECEIPT_WIDTH } from './ticketLayout';

export function resolveKitchenLineAmount(item) {
  const qty = Number(item?.quantity) || 0;
  const unit = Number(item?.unitPrice ?? item?.price) || 0;
  if (item?.lineTotal != null && item?.lineTotal !== '') {
    const total = Number(item.lineTotal);
    if (Number.isFinite(total) && total > 0) return total;
  }
  return Math.round(unit * qty * 100) / 100;
}

/** Name left; right = ×qty, or ×qty + money when showMoney. */
export function kitchenDishMainRow(item, { showMoney = false, width = RECEIPT_WIDTH } = {}) {
  const portion = item?.portionText ? ` (${item.portionText})` : '';
  const name = `${item?.name || ''}${portion}`.trim();
  const qty = Number(item?.quantity) || 0;
  if (!showMoney) return qtyNameRow(qty, name, width);
  const amount = resolveKitchenLineAmount(item);
  if (!(amount > 0)) return qtyNameRow(qty, name, width);
  const qtyLabel = Number.isInteger(qty) || Math.abs(qty - Math.round(qty)) < 0.0005
    ? `×${Math.round(qty)}`
    : `×${qty}`;
  return padRow(name, `${qtyLabel}  ${fmtMoneyCompact(amount)}`, width);
}

export function kitchenDishBlockLines(item, { showMoney = false } = {}) {
  const lines = [kitchenDishMainRow(item, { showMoney })];
  const mods = (item?.modifiers || [])
    .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
    .filter(Boolean)
    .join(', ');
  if (mods) lines.push(`   + ${mods}`);
  if (item?.note) lines.push(`   * ${item.note}`);
  return lines;
}

export function styleKitchenDishBlock(items, profile, slipType) {
  const showMoney = fieldStyle(profile, slipType, 'totals').on;
  const styled = (items || []).flatMap((item) => kitchenDishBlockLines(item, { showMoney }).map((row) => {
    if (!row || String(row).startsWith('   ')) return row;
    return styleDishLine(row, profile, slipType);
  }).filter((row) => row != null));

  if (!showMoney || !items?.length) return styled;
  const sum = (items || []).reduce((acc, item) => acc + resolveKitchenLineAmount(item), 0);
  if (!(sum > 0)) return styled;
  return [...styled, moneyRow('ИТОГО', sum, RECEIPT_WIDTH)];
}
