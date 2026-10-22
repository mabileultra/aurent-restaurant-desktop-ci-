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
 * Один короткий сигнал зуммера, затем отрез.
 * ESC B — команда Epson, её же понимают типичные чековые принтеры.
 * @param {import('node-thermal-printer').printer} printer
 */
function beepAndCut(printer) {
  if (typeof printer.beep === 'function') {
    printer.beep(1, 2);
  }
  printer.cut();
}

module.exports = {
  appendRow,
  appendDivider,
  appendCenterHeader,
  beepAndCut,
};
