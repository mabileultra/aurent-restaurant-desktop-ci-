/**
 * Общие команды вёрстки ESC/POS (чек, отчёты, этикетки).
 */

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {string} label
 * @param {string} value
 * @param {boolean} [bold]
 */
function appendRow(printer, label, value, bold = false) {
  if (bold) printer.bold(true);
  printer.leftRight(String(label), String(value));
  if (bold) printer.bold(false);
}

/**
 * @param {import('node-thermal-printer').printer} printer
 */
function appendDivider(printer) {
  printer.drawLine();
}

/**
 * Центрированная шапка (название, подзаголовок).
 * @param {import('node-thermal-printer').printer} printer
 * @param {string[]} lines
 */
function appendCenterHeader(printer, lines) {
  printer.alignCenter();
  for (const line of lines) {
    if (!line) continue;
    printer.println(String(line));
  }
  printer.alignLeft();
}

const { appendAlertBeeps } = require('./escpos-alert-beep.cjs');

/**
 * Сигнал зуммера, затем отрез.
 * @param {import('node-thermal-printer').printer} printer
 * @param {number} [times=1]
 * @param {number} [duration=2]
 * @param {{ pulseDrawer?: boolean }} [opts] — pulseDrawer только для кухни
 */
function beepAndCut(printer, times = 1, duration = 2, opts = {}) {
  appendAlertBeeps(printer, {
    times,
    duration,
    pulseDrawer: Boolean(opts.pulseDrawer),
  });
  printer.cut();
}

module.exports = {
  appendRow,
  appendDivider,
  appendCenterHeader,
  beepAndCut,
};
