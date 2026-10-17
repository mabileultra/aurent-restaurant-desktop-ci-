const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeHostList } = require('../electron/scales/scale-config.cjs');

test('normalizeHostList merges legacy + list, dedupes', () => {
  const hosts = normalizeHostList({
    scaleHost: '192.168.0.203',
    scaleTcpPort: 1111,
    scaleHosts: [
      { host: '192.168.0.204', udpPort: 1111, label: 'Зал 2' },
      { host: '192.168.0.203', udpPort: 1111 },
    ],
  });
  assert.equal(hosts.length, 2);
  assert.equal(hosts[0].host, '192.168.0.204');
  assert.equal(hosts[1].host, '192.168.0.203');
});
