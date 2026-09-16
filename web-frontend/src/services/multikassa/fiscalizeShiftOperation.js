import { buildCloseShiftBody, buildOpenShiftBody, buildXReportBody } from './buildMultikassaOperations';
import { ensureMkFiscalPrinter } from './ensureMkFiscalPrinter';
import { postOperation } from './multikassaHttpClient';

/** Фискализация открытия/закрытия смены и X-отчёта (вызывать с кассы). */
export async function fiscalizeShiftOperation({
  kind,
  capabilities,
  shiftId,
  cashierName,
  zReportNumber,
}) {
  if (!capabilities?.enabled) {
    return null;
  }
  const args = { capabilities, shiftId, cashierName, zReportNumber };
  let body;
  if (kind === 'open') body = buildOpenShiftBody(args);
  else if (kind === 'close') body = buildCloseShiftBody(args);
  else if (kind === 'x') body = buildXReportBody(args);
  else throw new Error(`Unknown shift fiscal kind: ${kind}`);

  try {
    await ensureMkFiscalPrinter(capabilities.baseUrl);
  } catch {
    // смена всё равно уходит; MK Fiscal сам ответит, если принтер не выбран
  }
  return postOperation(capabilities.baseUrl, body);
}
