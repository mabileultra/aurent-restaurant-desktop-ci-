import { pullAndApplyCatalogSnapshots } from './catalogSnapshotSync';

const DEFAULT_PAGE_LIMIT = 100;
const DEFAULT_MAX_PAGES = 20;

/**
 * Drain catalog outbox feed in pages so reconnect does not leave a huge backlog
 * that makes the next sync feel "stuck thinking".
 */
export async function drainCatalogSnapshots(since, { catalogKind, pageLimit = DEFAULT_PAGE_LIMIT, maxPages = DEFAULT_MAX_PAGES } = {}) {
  let cursor = since;
  let applied = 0;
  let pages = 0;
  let lastData = null;

  while (pages < maxPages) {
    const page = await pullAndApplyCatalogSnapshots(cursor, {
      catalogKind,
      limit: pageLimit,
    });
    if (page?.skipped) {
      return { skipped: true, reason: page.reason, applied, pages, data: page.data };
    }
    lastData = page?.data ?? lastData;
    const n = Number(page?.applied || 0);
    applied += n;
    pages += 1;
    cursor = page?.data?.syncedAt || cursor;
    if (n < pageLimit) {
      break;
    }
  }

  return { skipped: false, applied, pages, data: lastData };
}
