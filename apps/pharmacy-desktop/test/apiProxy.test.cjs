const test = require('node:test');
const assert = require('node:assert/strict');
const { filterHeaders } = require('../electron/ui/apiProxy');

test('filterHeaders strips hop-by-hop fields', () => {
  const out = filterHeaders({
    host: '127.0.0.1:1234',
    connection: 'keep-alive',
    authorization: 'Bearer x',
    'content-length': '10',
    'accept-encoding': 'gzip',
    'x-request-id': 'abc',
  });
  assert.equal(out.host, undefined);
  assert.equal(out.connection, undefined);
  assert.equal(out['content-length'], undefined);
  assert.equal(out['accept-encoding'], undefined);
  assert.equal(out.authorization, 'Bearer x');
  assert.equal(out['x-request-id'], 'abc');
});
