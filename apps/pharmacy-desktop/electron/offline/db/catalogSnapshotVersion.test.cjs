const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shouldApplySnapshot, compareSnapshotTime } = require('./catalogSnapshotVersion.cjs');

test('newer or equal snapshot applies; older is skipped', () => {
  const existing = { updatedAt: '2026-11-02T12:00:00Z' };
  assert.equal(shouldApplySnapshot({ updatedAt: '2026-11-02T12:00:00Z' }, existing), true);
  assert.equal(shouldApplySnapshot({ updatedAt: '2026-11-02T12:01:00Z' }, existing), true);
  assert.equal(shouldApplySnapshot({ updatedAt: '2026-11-02T11:59:00Z' }, existing), false);
});

test('missing timestamps apply (safe fallback)', () => {
  assert.equal(shouldApplySnapshot({ updatedAt: '2026-11-02T12:00:00Z' }, null), true);
  assert.equal(shouldApplySnapshot({ updatedAt: '2026-11-02T12:00:00Z' }, {}), true);
  assert.equal(shouldApplySnapshot({}, { updatedAt: '2026-11-02T12:00:00Z' }), true);
});

test('compareSnapshotTime orders ISO strings', () => {
  assert.ok(compareSnapshotTime('2026-11-02T12:01:00Z', '2026-11-02T12:00:00Z') > 0);
  assert.equal(compareSnapshotTime('2026-11-02T12:00:00Z', '2026-11-02T12:00:00Z'), 0);
});
