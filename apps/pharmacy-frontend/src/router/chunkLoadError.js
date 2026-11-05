const RELOAD_FLAG = 'pos-chunk-reload';

export function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return (
    message.includes('Failed to fetch dynamically imported module')
    || message.includes('error loading dynamically imported module')
    || message.includes('Importing a module script failed')
    || message.includes('Unable to preload CSS')
    || message.includes('before initialization')
    || error?.name === 'ChunkLoadError'
  );
}

/** One automatic reload per page load. Stops a reload loop if the chunk is still missing. */
export function shouldAutoReloadChunk() {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, '1');
    return true;
  } catch {
    return false;
  }
}

export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* private mode */
  }
}
