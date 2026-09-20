import { useSyncExternalStore } from 'react';

function subscribe(onStoreChange) {
  window.addEventListener('resize', onStoreChange);
  window.visualViewport?.addEventListener('resize', onStoreChange);
  return () => {
    window.removeEventListener('resize', onStoreChange);
    window.visualViewport?.removeEventListener('resize', onStoreChange);
  };
}

function readSizeKey() {
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;
  return `${width}|${height}`;
}

export function useViewportInnerSize() {
  const key = useSyncExternalStore(subscribe, readSizeKey, () => '1024|768');
  const [width, height] = key.split('|').map(Number);
  return { width, height };
}
