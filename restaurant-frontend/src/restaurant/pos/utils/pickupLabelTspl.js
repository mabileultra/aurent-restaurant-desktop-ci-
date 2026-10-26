import { plainSlipLine } from '../../shared/printProfile/applyPrintProfile';

function safe(value) {
  return String(value || '').replace(/"/g, '\'');
}

/** One 40×30 mm sticker. Windows driver mode does not use this. */
export function buildPickupTspl({ pickupNo, lines = [] } = {}) {
  const cmds = [
    'SIZE 40 mm,30 mm',
    'GAP 2 mm,0 mm',
    'DIRECTION 1',
    'CLS',
    `TEXT 16,16,"4",0,2,2,"${safe(pickupNo)}"`,
  ];
  lines.slice(0, 4).forEach((line, index) => {
    const text = safe(plainSlipLine(line));
    if (!text) return;
    cmds.push(`TEXT 16,${72 + index * 28},"2",0,1,1,"${text}"`);
  });
  cmds.push('PRINT 1,1');
  return `${cmds.join('\r\n')}\r\n`;
}
