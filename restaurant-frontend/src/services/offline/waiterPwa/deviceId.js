/** Waiter PWA device id (stable per browser profile). */

import { idbGet, idbPut, newId } from './idb';

const META_KEY = 'deviceId';
const LS_KEY = 'rst-waiter-device-id';

export async function getWaiterDeviceId() {
  try {
    const row = await idbGet('meta', META_KEY);
    if (row?.value) return String(row.value);
  } catch {
    /* fall through */
  }
  let fromLs = null;
  try {
    fromLs = localStorage.getItem(LS_KEY);
  } catch {
    fromLs = null;
  }
  const id = fromLs || newId();
  try {
    localStorage.setItem(LS_KEY, id);
  } catch {
    /* ignore */
  }
  await idbPut('meta', { key: META_KEY, value: id }).catch(() => null);
  return id;
}
