const { test } = require('node:test');
const assert = require('node:assert/strict');
const { originsNeedPush } = require('../electron/runtime/edgeLiveOriginProbe');

test('originsNeedPush: empty → false', () => {
  assert.equal(originsNeedPush(new Map(), new Map()), false);
});

test('originsNeedPush: new origin > 0 → true', () => {
  const origins = new Map([[44, 3]]);
  assert.equal(originsNeedPush(origins, new Map()), true);
});

test('originsNeedPush: same as last pushed → false', () => {
  const origins = new Map([[44, 3]]);
  const last = new Map([[44, 3]]);
  assert.equal(originsNeedPush(origins, last), false);
});

test('originsNeedPush: grew past last → true', () => {
  const origins = new Map([[44, 5]]);
  const last = new Map([[44, 3]]);
  assert.equal(originsNeedPush(origins, last), true);
});

test('originsNeedPush: origin 0 ignored', () => {
  const origins = new Map([[44, 0]]);
  assert.equal(originsNeedPush(origins, new Map()), false);
});
