import { rstMenuApi } from '../../api/menu.api';
import {
  menuImageGeneration,
  menuImageShiftMode,
  peekMenuImageSrc,
  putMenuImageBlob,
} from './menuImageShiftCache';

/** Few photo downloads at a time. Paused while the cashier is paying or printing. */
const MAX_IN_FLIGHT = 4;

let running = 0;
let paused = false;
let busyCount = 0;
const waiting = [];
const inflight = new Map();

function pump() {
  while (!paused && running < MAX_IN_FLIGHT && waiting.length > 0) {
    const job = waiting.shift();
    running += 1;
    job.run()
      .then(job.resolve, job.reject)
      .finally(() => {
        running -= 1;
        pump();
      });
  }
}

function enqueue(run) {
  return new Promise((resolve, reject) => {
    waiting.push({ run, resolve, reject });
    pump();
  });
}

export function dropQueuedMenuImageLoads() {
  const dropped = waiting.splice(0, waiting.length);
  for (const job of dropped) job.resolve(null);
}

export function pushMenuImageBusy() {
  busyCount += 1;
  paused = true;
}

export function popMenuImageBusy() {
  busyCount = Math.max(0, busyCount - 1);
  paused = busyCount > 0;
  if (!paused) pump();
}

/**
 * @returns {Promise<{ src: string, owned: boolean } | null>}
 * owned urls must be revoked by the caller. Shift urls live until the shift ends.
 */
export function loadMenuImageBlob(itemId) {
  if (menuImageShiftMode() === 'closed') return Promise.resolve(null);
  const cached = peekMenuImageSrc(itemId);
  if (cached) return Promise.resolve({ src: cached, owned: false });
  const current = inflight.get(itemId);
  if (current) return current;
  const pending = enqueue(() => {
    if (menuImageShiftMode() === 'closed') return Promise.resolve(null);
    const started = menuImageGeneration();
    return rstMenuApi.getImageBlob(itemId).then((blob) => ({ blob, started }));
  }).then((packed) => {
    if (!packed?.blob) return null;
    if (packed.started !== menuImageGeneration()) return null;
    const mode = menuImageShiftMode();
    if (mode === 'closed') return null;
    if (mode === 'open') {
      const src = putMenuImageBlob(itemId, packed.blob);
      return src ? { src, owned: false } : null;
    }
    return { src: URL.createObjectURL(packed.blob), owned: true };
  }).finally(() => {
    inflight.delete(itemId);
  });
  inflight.set(itemId, pending);
  return pending;
}
