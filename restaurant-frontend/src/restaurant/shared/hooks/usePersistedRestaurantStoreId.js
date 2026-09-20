import { useCallback, useState } from 'react';

const STORAGE_KEY = 'aurent.rst.workspaceStoreId';

function readStoredId() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw && /^\d+$/.test(raw) ? raw : '';
  } catch {
    return '';
  }
}

/** Persist selected restaurant branch for the browser tab. */
export function usePersistedRestaurantStoreId() {
  const [pickedStoreId, setPicked] = useState(readStoredId);

  const setPickedStoreId = useCallback((value) => {
    const next = value == null ? '' : String(value);
    setPicked(next);
    try {
      if (next) sessionStorage.setItem(STORAGE_KEY, next);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore quota / private mode
    }
  }, []);

  return [pickedStoreId, setPickedStoreId];
}
