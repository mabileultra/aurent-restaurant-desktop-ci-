/**
 * Единая печать фiscal-чека:
 * — desktop-касса: ESC/POS (locale ru/uz, PC866/WPC1252);
 * — браузер / отчёты: window.print() по DOM.
 */
import {
  isCashierEscposPrintAvailable,
  printSaleReceiptEscpos,
} from './printSaleReceiptEscpos';

/**
 * @param {{ sale: object, t: Function, useModalShell?: boolean }} opts
 */
export async function printFiscalReceipt({ sale, t, useModalShell = true }) {
  if (isCashierEscposPrintAvailable()) {
    if (!sale) {
      throw new Error('No sale data for ESC/POS print');
    }
    try {
      return await printSaleReceiptEscpos(sale, t);
    } catch (err) {
      const msg = err?.message || String(err || '');
      // Старый desktop shell со stub ESC/POS — печатаем через диалог браузера.
      if (!/not implemented in desktop shell/i.test(msg)) {
        throw err;
      }
    }
  }

  const { printThermalReceiptDialog } = await import('../../utils/printReceipt');
  await printThermalReceiptDialog({ useModalShell });
  return { mode: 'dialog' };
}
