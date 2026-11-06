const urls = new Map();
const listeners = new Set();

/** idle: admin. open: cashier shift holds photos. closed: shift ended, do not load. */
let mode = 'idle';
let shiftId = null;
let generation = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

export function menuImageShiftMode() {
  return mode;
}

export function menuImageGeneration() {
  return generation;
}

export function peekMenuImageSrc(itemId) {
  return urls.get(itemId) || '';
}

export function putMenuImageBlob(itemId, blob) {
  const existing = urls.get(itemId);
  if (existing) return existing;
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  urls.set(itemId, url);
  emit();
  return url;
}

export function subscribeMenuImages(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function releaseMenuImageShift() {
  generation += 1;
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
  emit();
}

export function attachMenuImageShift(nextShiftId) {
  if (!nextShiftId) {
    releaseMenuImageShift();
    shiftId = null;
    mode = 'closed';
    emit();
    return;
  }
  if (shiftId === nextShiftId && mode === 'open') return;
  releaseMenuImageShift();
  shiftId = nextShiftId;
  mode = 'open';
  emit();
}

export function detachMenuImageShift() {
  releaseMenuImageShift();
  shiftId = null;
  mode = 'idle';
  emit();
}
