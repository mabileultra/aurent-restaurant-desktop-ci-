/** Normalize /platform/billing/collections/companies PageResponse (or legacy array). */
export function unwrapBillingCollectionsPage(data) {
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      size: data.length,
      number: 0,
    };
  }
  const content = Array.isArray(data?.content) ? data.content : [];
  return {
    content,
    totalElements: Number(data?.totalElements) || content.length,
    totalPages: Number(data?.totalPages) || 1,
    size: Number(data?.size) || content.length,
    number: Number(data?.number) || 0,
  };
}

/** Calendar / ledger enrichment: one large page, not the table default. */
export const BILLING_COLLECTIONS_ENRICH_SIZE = 2000;
