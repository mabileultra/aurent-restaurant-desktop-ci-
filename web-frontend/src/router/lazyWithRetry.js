import { lazy } from 'react';
import { isChunkLoadError, shouldAutoReloadChunk } from './chunkLoadError';

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * React.lazy caches a rejected import. A failed chunk then sticks until a full reload,
 * which is the "Обновить" screen. Retry the same import, then reload once.
 */
export async function importWithRetry(importer, attempts = 3) {
  try {
    return await importer();
  } catch (error) {
    if (!isChunkLoadError(error)) throw error;
    if (attempts > 1) {
      await wait(400 * (4 - attempts));
      return importWithRetry(importer, attempts - 1);
    }
    if (shouldAutoReloadChunk()) {
      window.location.reload();
      return new Promise(() => {});
    }
    throw error;
  }
}

export function lazyPage(importer) {
  return lazy(() => importWithRetry(importer));
}
