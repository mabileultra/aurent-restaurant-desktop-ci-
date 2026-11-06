/** Match large Excel grids in chunks so gateway/body limits and timeouts do not fail 150–1000 row invoices. */
export const PHARMACY_IMPORT_MATCH_CHUNK = 100;

export async function runPharmacyImportMatchChunks({
  rows,
  roles,
  useFinalSums,
  invoiceId,
  matchRequest,
  chunkSize = PHARMACY_IMPORT_MATCH_CHUNK,
}) {
  const allRows = Array.isArray(rows) ? rows : [];
  const size = Math.max(1, Number(chunkSize) || PHARMACY_IMPORT_MATCH_CHUNK);
  const items = [];
  let resolvedInvoiceId = invoiceId || null;
  let invoiceAlreadyImported = false;

  for (let offset = 0; offset < allRows.length; offset += size) {
    const chunk = allRows.slice(offset, offset + size);
    const data = await matchRequest({
      roles,
      rows: chunk,
      rowOffset: offset,
      totalRows: allRows.length,
      useFinalSums,
      uzInvoiceDocumentId: resolvedInvoiceId || undefined,
    });
    resolvedInvoiceId = data?.uzInvoiceDocumentId || resolvedInvoiceId;
    invoiceAlreadyImported = invoiceAlreadyImported || Boolean(data?.invoiceAlreadyImported);
    if (Array.isArray(data?.items)) {
      items.push(...data.items);
    }
  }

  return {
    uzInvoiceDocumentId: resolvedInvoiceId,
    invoiceAlreadyImported,
    items,
  };
}
