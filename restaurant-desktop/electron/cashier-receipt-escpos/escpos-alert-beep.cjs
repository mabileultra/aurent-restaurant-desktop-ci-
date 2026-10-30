/**
 * Multi-vendor kitchen/receipt alert before cut.
 * ESC B alone is silent on many Chinese printers without a buzzer;
 * BEL + optional DK pulse cover those cases (external kitchen buzzer on drawer port).
 */

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {{ times?: number, duration?: number, pulseDrawer?: boolean }} [opts]
 */
function appendAlertBeeps(printer, opts = {}) {
  const times = Math.min(9, Math.max(1, Number(opts.times) || 1));
  const duration = Math.min(9, Math.max(1, Number(opts.duration) || 2));

  if (typeof printer.beep === 'function') {
    try {
      printer.beep(times, duration);
    } catch {
      /* ignore invalid beep args on exotic drivers */
    }
  }

  if (typeof printer.append === 'function') {
    for (let i = 0; i < times; i += 1) {
      // ASCII BEL — works on several ESC/POS clones that ignore ESC B.
      printer.append(Buffer.from([0x07]));
    }
  }

  // Kitchen only: pulse cash-drawer port (often wired to an external buzzer).
  // Do NOT enable on cashier receipts — would open the real money drawer.
  if (opts.pulseDrawer && typeof printer.openCashDrawer === 'function') {
    try {
      printer.openCashDrawer();
    } catch {
      /* ignore */
    }
  }
}

module.exports = { appendAlertBeeps };
