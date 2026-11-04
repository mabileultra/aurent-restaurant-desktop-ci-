import { runLimited } from '../../../utils/runLimited';

export const PHARMACY_CATALOG_OPTIONS_PAGE_SIZE = 200;
export const PHARMACY_CATALOG_OPTIONS_CONCURRENCY = 8;

/**
 * Тянет все страницы товаров аптеки параллельно (для справочников АТХ / производитель).
 */
export async function fetchAllPharmacyProductPages({
  listProducts,
  pageSize = PHARMACY_CATALOG_OPTIONS_PAGE_SIZE,
  concurrency = PHARMACY_CATALOG_OPTIONS_CONCURRENCY,
}) {
  const first = await listProducts({ page: 0, size: pageSize, activeOnly: false });
  const totalPages = Math.max(1, Number(first?.totalPages) || 1);
  const byPage = new Map([[0, first]]);

  if (totalPages > 1) {
    const rest = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    await runLimited(rest, concurrency, async (page) => {
      const data = await listProducts({ page, size: pageSize, activeOnly: false });
      byPage.set(page, data);
    });
  }

  const content = [];
  for (let page = 0; page < totalPages; page += 1) {
    const chunk = byPage.get(page)?.content;
    if (Array.isArray(chunk)) content.push(...chunk);
  }

  return {
    content,
    totalElements: Number(first?.totalElements) || content.length,
    totalPages,
  };
}
