/**
 * Startup / settings validation for restaurant local-first printers.
 * Does not block order COMMIT — UI warning only (soft-fail prints separately).
 */

/**
 * @param {object} opts
 * @param {{ id: string|number, name?: string }[]} [opts.stations]
 * @param {Record<string, string>} [opts.stationPrinters]
 * @param {string} [opts.billPrinterName]
 * @param {string[]} [opts.osPrinterNames]
 */
export function validateLocalFirstPrinterSetup({
  stations = [],
  stationPrinters = {},
  billPrinterName = '',
  osPrinterNames = [],
} = {}) {
  const os = new Set(
    (Array.isArray(osPrinterNames) ? osPrinterNames : [])
      .map((n) => String(n || '').trim().toLowerCase())
      .filter(Boolean),
  );

  const map = stationPrinters && typeof stationPrinters === 'object' ? stationPrinters : {};
  const stationRows = (Array.isArray(stations) ? stations : []).map((station) => {
    const id = station?.id;
    const printerName = String(map[id] || map[String(id)] || '').trim();
    let ok = false;
    let reason = 'missing';
    if (printerName) {
      if (!os.size || os.has(printerName.toLowerCase())) {
        ok = true;
        reason = 'ok';
      } else {
        reason = 'not_on_device';
      }
    }
    return {
      stationId: id,
      stationName: station?.name || String(id ?? ''),
      printerName,
      ok,
      reason,
    };
  });

  const mappedLoose = Object.values(map)
    .map((n) => String(n || '').trim())
    .filter(Boolean);
  const hasKitchenPrinter = stationRows.some((r) => r.printerName) || mappedLoose.length > 0;
  const missingStations = stationRows.filter((r) => !r.ok);

  const bill = String(billPrinterName || '').trim();
  let billOk = true;
  let billReason = 'ok';
  if (bill && os.size && !os.has(bill.toLowerCase())) {
    billOk = false;
    billReason = 'not_on_device';
  } else if (!bill) {
    billReason = 'optional';
  }

  return {
    /** All known stations have a usable printer mapping. */
    ok: stationRows.length === 0 ? hasKitchenPrinter : missingStations.length === 0,
    /** At least one kitchen printer configured — local send can attempt print. */
    canOperate: hasKitchenPrinter,
    stationRows,
    missingStations,
    bill: { printerName: bill, ok: billOk, reason: billReason },
  };
}
