const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isUpstreamDownError,
  isCircuitOpen,
  noteUpstreamFailure,
  noteUpstreamSuccess,
  resetCircuitForTests,
} = require('../electron/ui/apiProxyCircuit');

test('apiProxyCircuit opens on ENOTFOUND and closes on success', () => {
  resetCircuitForTests();
  assert.equal(isCircuitOpen(), false);
  assert.equal(isUpstreamDownError({ code: 'ENOTFOUND' }), true);

  const first = noteUpstreamFailure({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND aurent.uz' });
  assert.equal(first.open, true);
  assert.equal(first.shouldLog, true);
  assert.equal(isCircuitOpen(), true);

  const second = noteUpstreamFailure({ code: 'ENOTFOUND' });
  assert.equal(second.open, true);
  assert.equal(second.shouldLog, false);

  noteUpstreamSuccess();
  assert.equal(isCircuitOpen(), false);
});
