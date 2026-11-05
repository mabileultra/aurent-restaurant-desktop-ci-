/** Confirm in bounded chunks so gateway/timeout and DB work stay stable on 100–1000 line invoices. */
export const PHARMACY_IMPORT_CONFIRM_CHUNK = 80;

export async function runPharmacyImportConfirmChunks({
  items,
  invoiceId,
  confirmRequest,
  chunkSize = PHARMACY_IMPORT_CONFIRM_CHUNK,
  onChunkSaved,
}) {
  const body = Array.isArray(items) ? items : [];
  const size = Math.max(1, Number(chunkSize) || PHARMACY_IMPORT_CONFIRM_CHUNK);
  let added = 0;

  for (let i = 0; i < body.length; i += size) {
    const chunk = body.slice(i, i + size);
    await confirmRequest({
      uzInvoiceDocumentId: invoiceId || undefined,
      items: chunk,
    });
    added += chunk.length;
    onChunkSaved?.(chunk);
  }

  return { added };
}
