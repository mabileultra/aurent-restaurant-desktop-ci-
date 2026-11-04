import { drainPagedFeed } from '@aurent/shared-offline';
import { pullAndApplyCatalogSnapshots } from './catalogSnapshotSync';

const DEFAULT_PAGE_LIMIT = 100;
const DEFAULT_MAX_PAGES = 20;

/**
 * Drain catalog outbox feed in pages so reconnect does not leave a huge backlog
 * that makes the next sync feel "stuck thinking".
 */
export async function drainCatalogSnapshots(since, { catalogKind, pageLimit = DEFAULT_PAGE_LIMIT, maxPages = DEFAULT_MAX_PAGES } = {}) {
  return drainPagedFeed({
    since,
    pageLimit,
    maxPages,
    fetchPage: (cursor, { limit }) => pullAndApplyCatalogSnapshots(cursor, {
      catalogKind,
      limit,
    }),
  });
}
