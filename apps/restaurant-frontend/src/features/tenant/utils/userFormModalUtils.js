export const userFormInputCls = 'user-form-modal__input';

export function toStoreIdSet(ids) {
  const list = Array.isArray(ids) ? ids : [];
  return new Set(list.map((id) => Number(id)).filter((n) => !Number.isNaN(n)));
}

export function cashierStoreSet(ids) {
  const arr = Array.from(toStoreIdSet(ids));
  return arr.length > 0 ? new Set([arr[0]]) : new Set();
}

export function asStoreList(data) {
  return Array.isArray(data) ? data : [];
}
