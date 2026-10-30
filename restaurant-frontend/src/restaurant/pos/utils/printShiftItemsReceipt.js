import { fmtMoneyCompact } from '../../../utils/formatMoney';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  printTicketLines,
} from './desktopPrinters';
import { escapeHtml, printViaIframe } from './printOrdinarySaleReceipt';
import { moneyRow, padRow, ticketStamp, TICKET_WIDTH } from './ticketLayout';
import {
  resolveTicketTitle,
  ticketPrintOptions,
  wrapSlipLines,
} from '../../shared/printProfile/applyPrintProfile';
import { fieldStyle } from '../../shared/printProfile/printProfileDefaults';
import { loadStorePrintProfile } from '../../shared/printProfile/loadStorePrintProfile';
import { slipChromeHtml } from './slipChromeHtml';

/** Preserve API order; bucket rows under category headers. */
export function groupShiftItemsByCategory(items, uncategorizedLabel) {
  const groups = [];
  const indexByKey = new Map();
  for (const row of items) {
    const key = String(row?.categoryName || '').trim() || uncategorizedLabel;
    let group = indexByKey.get(key);
    if (!group) {
      group = { label: key, items: [], quantity: 0, amount: 0 };
      indexByKey.set(key, group);
      groups.push(group);
    }
    group.items.push(row);
    group.quantity += Number(row.quantity) || 0;
    group.amount += Number(row.amount) || 0;
  }
  return groups;
}

/**
 * Non-fiscal slip printed on shift close: every dish sold during the shift.
 * @param {{ report: object, storeName?: string, cashierName?: string, t?: Function }} opts
 */
export async function printShiftItemsReceipt({ report, storeName, cashierName, t } = {}) {
  if (typeof window === 'undefined' || !report) return { mode: 'skip' };

  const items = Array.isArray(report.items) ? report.items : [];
  const title = t?.('rst.shift.itemsTitle', { defaultValue: 'Продано за смену' }) || 'Продано за смену';
  const totalQty = items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const store = report.storeName || storeName || '';
  const cashier = report.cashierName || cashierName || '';
  const period = `${ticketStamp(report.openedAt)} — ${ticketStamp(report.reportAt)}`;
  const totalLabel = t?.('rst.order.totalDue', { defaultValue: 'ИТОГО' }) || 'ИТОГО';
  const qtyLabel = t?.('rst.shift.itemsQty', { count: totalQty, defaultValue: `${totalQty} шт.` }) || `${totalQty} шт.`;
  const emptyLabel = t?.('rst.shift.itemsEmpty', { defaultValue: 'Продаж нет' }) || 'Продаж нет';
  const uncategorized = t?.('rst.shift.itemsUncategorized', { defaultValue: 'Без категории' }) || 'Без категории';
  const divider = '-'.repeat(TICKET_WIDTH);
  const groups = groupShiftItemsByCategory(items, uncategorized);

  const profile = await loadStorePrintProfile(report.storeId);
  const slipType = 'SHIFT_ITEMS';
  const show = (key) => fieldStyle(profile, slipType, key).on;
  const withMoney = show('totals');
  const itemLines = items.length
    ? groups.flatMap((group, index) => {
      const catQty = t?.('rst.shift.itemsQty', {
        count: group.quantity,
        defaultValue: `${group.quantity} шт.`,
      }) || `${group.quantity} шт.`;
      const block = [
        `≫ ${group.label}`,
        ...group.items.map((row) => (
          withMoney
            ? padRow(`${Number(row.quantity)} x ${row.name}`, fmtMoneyCompact(row.amount))
            : padRow(`${Number(row.quantity)} x ${row.name}`, '')
        )),
        ...(withMoney
          ? [padRow(group.label, catQty), moneyRow('', group.amount)]
          : [padRow(group.label, catQty)]),
      ];
      return index < groups.length - 1 ? [...block, divider] : block;
    })
    : [emptyLabel];
  const lines = wrapSlipLines([
    ...(show('headerTitle') ? [title.toUpperCase()] : []),
    ...(store ? [store] : []),
    ...(show('waiter') && cashier ? [cashier] : []),
    ...(show('time') ? [period] : []),
    divider,
    ...(show('items') ? itemLines : []),
    ...(withMoney ? [divider, padRow(totalLabel, qtyLabel), moneyRow('', totalAmount)] : []),
  ], profile, slipType);

  if (isDesktopPrinter()) {
    const settings = await getDesktopPrinterSettings();
    const printer = settings?.receiptPrinterName || '';
    if (printer) {
      await printTicketLines({
        title: resolveTicketTitle(title, profile, slipType),
        lines,
        printerName: printer,
        ...ticketPrintOptions(profile, slipType),
      });
      return { mode: 'silent' };
    }
  }

  const rowsHtml = items.length
    ? groups.map((group) => {
      const catQty = t?.('rst.shift.itemsQty', {
        count: group.quantity,
        defaultValue: `${group.quantity} шт.`,
      }) || `${group.quantity} шт.`;
      const dishRows = group.items.map((row) => (
        withMoney
          ? `<div class="rst-ord-print__row"><span>${escapeHtml(`${Number(row.quantity)} × ${row.name}`)}</span><strong>${fmtMoneyCompact(row.amount)}</strong></div>`
          : `<div class="rst-ord-print__row"><span>${escapeHtml(`${Number(row.quantity)} × ${row.name}`)}</span></div>`
      )).join('');
      return `
        <p class="rst-ord-print__cat">${escapeHtml(`≫ ${group.label}`)}</p>
        ${dishRows}
        <div class="rst-ord-print__row"><span>${escapeHtml(group.label)} · ${escapeHtml(catQty)}</span>${withMoney ? `<strong>${fmtMoneyCompact(group.amount)}</strong>` : ''}</div>
      `;
    }).join('<hr />')
    : `<p>${escapeHtml(emptyLabel)}</p>`;

  const chrome = slipChromeHtml(profile, slipType, escapeHtml);
  await printViaIframe(`
    <div class="rst-ord-print">
      ${chrome.logo}
      ${chrome.head}
      ${show('headerTitle') ? `<p class="rst-ord-print__title">${escapeHtml(title)}</p>` : ''}
      ${store ? `<p class="rst-ord-print__store">${escapeHtml(store)}</p>` : ''}
      ${show('waiter') && cashier ? `<p class="rst-ord-print__meta">${escapeHtml(cashier)}</p>` : ''}
      ${show('time') ? `<p class="rst-ord-print__meta">${escapeHtml(period)}</p>` : ''}
      ${show('items') ? `<hr />${rowsHtml}` : `<p>${escapeHtml(emptyLabel)}</p>`}
      ${show('totals') ? `<hr /><div class="rst-ord-print__row rst-ord-print__row--grand"><span>${escapeHtml(totalLabel)} · ${escapeHtml(qtyLabel)}</span><strong>${fmtMoneyCompact(totalAmount)}</strong></div>` : ''}
      ${chrome.foot}
    </div>`);
  return { mode: 'dialog' };
}
