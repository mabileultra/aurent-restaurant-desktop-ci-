import { plainSlipLine } from '../../shared/printProfile/applyPrintProfile';

function safe(value) {
  return String(value || '').replace(/"/g, '\'');
}

/**
 * One sticker as TSPL. Sent RAW into the Windows queue (USB), not over TCP 9100.
 * Default size matches XP-365B stock New Stock (≈60.9×30.4 mm).
 */
export function buildPickupTspl({
  pickupNo,
  lines = [],
  widthMm = 61,
  heightMm = 30,
} = {}) {
  const w = Math.max(20, Number(widthMm) || 61);
  const h = Math.max(15, Number(heightMm) || 30);
  const cmds = [
    `SIZE ${w} mm,${h} mm`,
    'GAP 2 mm,0 mm',
    'DIRECTION 1',
    'CLS',
    `TEXT 16,12,"4",0,2,2,"${safe(pickupNo)}"`,
  ];
  lines.slice(0, 4).forEach((line, index) => {
    const text = safe(plainSlipLine(line));
    if (!text) return;
    cmds.push(`TEXT 16,${56 + index * 24},"2",0,1,1,"${text}"`);
  });
  cmds.push('PRINT 1,1');
  return `${cmds.join('\r\n')}\r\n`;
}
