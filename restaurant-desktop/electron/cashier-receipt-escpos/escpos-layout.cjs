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

/**
 * Сигнал зуммера, затем отрез.
 * ESC B — команда Epson, её же понимают типичные чековые принтеры.
 * @param {import('node-thermal-printer').printer} printer
 * @param {number} [times=1] — сколько коротких «тин» (кухня: 2)
 * @param {number} [duration=2] — длительность каждого (×50ms у Epson)
 */
function beepAndCut(printer, times = 1, duration = 2) {
  if (typeof printer.beep === 'function') {
    const n = Math.min(9, Math.max(1, Number(times) || 1));
    const t = Math.min(9, Math.max(1, Number(duration) || 2));
    printer.beep(n, t);
  }
  printer.cut();
}

module.exports = {
  appendRow,
  appendDivider,
  appendCenterHeader,
  beepAndCut,
};
