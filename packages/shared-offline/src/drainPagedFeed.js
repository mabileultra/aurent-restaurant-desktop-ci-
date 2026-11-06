/**
 * Generic outbox/page drain loop. App supplies fetchPage(cursor, { limit }).
 * Sale / catalog apply rules stay in the app.
 */
export async function drainPagedFeed({
  since,
  pageLimit = 100,
  maxPages = 20,
  fetchPage,
} = {}) {
  if (typeof fetchPage !== 'function') {
    throw new Error('drainPagedFeed requires fetchPage');
  }
  let cursor = since;
  let applied = 0;
  let pages = 0;
  let lastData = null;

  while (pages < maxPages) {
    const page = await fetchPage(cursor, { limit: pageLimit });
    if (page?.skipped) {
      return { skipped: true, reason: page.reason, applied, pages, data: page.data };
    }
    lastData = page?.data ?? lastData;
    const n = Number(page?.applied || 0);
    applied += n;
    pages += 1;
    cursor = page?.data?.syncedAt || cursor;
    if (n < pageLimit) break;
  }

  return { skipped: false, applied, pages, data: lastData };
}
