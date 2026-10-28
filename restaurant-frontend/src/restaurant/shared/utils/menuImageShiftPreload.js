import { parseMenuImageItemId } from './menuImageRef';
import {
  attachMenuImageShift,
  detachMenuImageShift,
  menuImageShiftMode,
  peekMenuImageSrc,
} from './menuImageShiftCache';
import { dropQueuedMenuImageLoads, loadMenuImageBlob } from './menuImageLoadQueue';

const queued = new Set();

export function resetMenuImagePreloadMarks() {
  queued.clear();
}

export function stopMenuImageShift() {
  dropQueuedMenuImageLoads();
  resetMenuImagePreloadMarks();
  detachMenuImageShift();
}

/** Queue missing dish photos once. Already cached ids are skipped. */
export function preloadMenuImages(items) {
  if (menuImageShiftMode() !== 'open') return;
  for (const item of items || []) {
    const itemId = parseMenuImageItemId(item?.imageUrl);
    if (!itemId || queued.has(itemId) || peekMenuImageSrc(itemId)) continue;
    queued.add(itemId);
    loadMenuImageBlob(itemId).catch(() => {
      queued.delete(itemId);
    });
  }
}

export function syncMenuImageShift(shiftId, items) {
  if (!shiftId) {
    dropQueuedMenuImageLoads();
    resetMenuImagePreloadMarks();
    attachMenuImageShift(null);
    return;
  }
  attachMenuImageShift(shiftId);
  preloadMenuImages(items);
}
