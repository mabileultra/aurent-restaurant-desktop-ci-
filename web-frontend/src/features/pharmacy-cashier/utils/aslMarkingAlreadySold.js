const SOLD_MARKERS = ['WITHDRAWN', 'WRITTEN_OFF', 'WRITTENOFF', 'SOLD', 'RETIRED', 'DROPPED_OUT', 'ВЫВЕДЕН', 'ПРОДАН', 'РЕАЛИЗОВ'];
const OPEN_STATUSES = new Set(['INTRODUCED', 'APPLIED', 'EMITTED']);

function hasSoldMarker(value) {
  const upper = String(value || '').toUpperCase();
  if (!upper || OPEN_STATUSES.has(upper)) return false;
  return SOLD_MARKERS.some((marker) => upper.includes(marker));
}

/** ASL уже вывел код из оборота — повторно в чек не кладём. */
export function isAslMarkAlreadySold(result) {
  if (!result) return false;
  if (result.alreadySold === true) return true;
  if (hasSoldMarker(result.status)) return true;
  const details = result.details || {};
  return ['status', 'codeStatus', 'extendedStatus', 'state', 'withdrawReason', 'withdrawalReason']
    .some((key) => hasSoldMarker(details[key]));
}
