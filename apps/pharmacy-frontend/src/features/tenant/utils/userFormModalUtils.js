export const userFormInputCls = 'ui-input';

export function toStoreIdSet(ids) {
  if (ids instanceof Set) return ids;
  if (typeof ids === 'number' || typeof ids === 'string') {
    const n = Number(ids);
    return !Number.isNaN(n) ? new Set([n]) : new Set();
  }
  const list = Array.isArray(ids)
    ? ids
    : (ids && typeof ids === 'object' && Array.isArray(ids.stores) ? ids.stores : []);
  return new Set(
    list
      .map((item) => (item && typeof item === 'object' ? item.id : item))
      .map((id) => Number(id))
      .filter((n) => !Number.isNaN(n))
  );
}

export function cashierStoreSet(ids) {
  const arr = Array.from(toStoreIdSet(ids));
  return arr.length > 0 ? new Set([arr[0]]) : new Set();
}

export function asStoreList(data) {
  return Array.isArray(data) ? data : [];
}
