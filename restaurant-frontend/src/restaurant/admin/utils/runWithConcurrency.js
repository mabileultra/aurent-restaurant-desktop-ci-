/**
 * Run async workers over items with a fixed concurrency pool.
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} worker
 * @param {{ onProgress?: (done: number, total: number, result: R, index: number) => void }} [opts]
 * @returns {Promise<R[]>}
 */
export async function runWithConcurrency(items, limit, worker, opts = {}) {
  const list = items || [];
  const total = list.length;
  const results = new Array(total);
  if (!total) return results;

  const pool = Math.max(1, Math.min(limit || 1, total));
  let nextIndex = 0;
  let done = 0;

  const runOne = async () => {
    while (nextIndex < total) {
      const index = nextIndex;
      nextIndex += 1;
      const result = await worker(list[index], index);
      results[index] = result;
      done += 1;
      opts.onProgress?.(done, total, result, index);
    }
  };

  await Promise.all(Array.from({ length: pool }, () => runOne()));
  return results;
}
