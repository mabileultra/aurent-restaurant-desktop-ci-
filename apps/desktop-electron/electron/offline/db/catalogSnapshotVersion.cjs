/**
 * Compare ProductSnapshot updatedAt so out-of-order / duplicate delivery
 * does not overwrite a newer local card.
 * @returns {number} <0 if a<b, 0 if equal/unknown, >0 if a>b
 */
function compareSnapshotTime(a, b) {
  const ta = toMillis(a);
  const tb = toMillis(b);
  if (ta == null || tb == null) {
    return 0;
  }
  return ta - tb;
}

function toMillis(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? ms : null;
}

/** True when incoming should apply over existing local row. */
function shouldApplySnapshot(event, existing) {
  if (!existing || existing.updatedAt == null) {
    return true;
  }
  if (event?.updatedAt == null) {
    return true;
  }
  return compareSnapshotTime(event.updatedAt, existing.updatedAt) >= 0;
}

module.exports = {
  compareSnapshotTime,
  shouldApplySnapshot,
  toMillis,
};
