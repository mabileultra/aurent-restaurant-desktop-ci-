'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const dgram = require('dgram');
const { bindShtrihUdpSocket, preferredLocalPort } = require('../electron/scales/scale-shtrih-udp-bind.cjs');
const { DEFAULT_LOCAL_UDP_PORT } = require('../electron/scales/scale-shtrih-packet.cjs');
const { pushPluToShtrih, probeShtrihUdp } = require('../electron/scales/scale-shtrih-udp.cjs');

test('preferredLocalPort по умолчанию 2000', () => {
  assert.equal(preferredLocalPort(), DEFAULT_LOCAL_UDP_PORT);
  assert.equal(DEFAULT_LOCAL_UDP_PORT, 2000);
});

test('bindShtrihUdpSocket: предпочитает 2000, иначе ephemeral', async () => {
  const blocker = dgram.createSocket('udp4');
  await new Promise((resolve, reject) => {
    blocker.once('error', reject);
    blocker.bind(DEFAULT_LOCAL_UDP_PORT, '127.0.0.1', () => resolve());
  });
  try {
    const bound = await bindShtrihUdpSocket();
    assert.equal(bound.preferred, false);
    assert.notEqual(bound.localPort, DEFAULT_LOCAL_UDP_PORT);
    bound.socket.close();
  } finally {
    await new Promise((resolve) => blocker.close(() => resolve()));
  }
});

test('probe + push на локальный эмулятор 0x11/0x50', async () => {
  const sock = dgram.createSocket('udp4');
  const pluDb = new Map();
  await new Promise((resolve, reject) => {
    sock.once('error', reject);
    sock.bind(0, '127.0.0.1', () => resolve());
  });
  const port = sock.address().port;
  sock.on('message', (msg, rinfo) => {
    if (msg[0] !== 0x02 || msg.length < 3) return;
    const cmd = msg[2];
    if (cmd === 0x11) {
      const reply = Buffer.from([0x02, 0x07, 0x11, 0x00, 0xd2, 0x04, 0x00, 0x00, 0x01]);
      sock.send(reply, rinfo.port, rinfo.address);
      return;
    }
    if (cmd === 0x50) {
      const plu = msg.readUInt16LE(7);
      pluDb.set(plu, true);
      sock.send(Buffer.from([0x02, 0x02, 0x50, 0x00]), rinfo.port, rinfo.address);
    }
  });

  try {
    const probe = await probeShtrihUdp('127.0.0.1', port, 800);
    assert.equal(probe.ok, true);
    const push = await pushPluToShtrih(
      [{ plu: '9', name: 'Тест', pricePerKg: 10 }],
      { host: '127.0.0.1', udpPort: port, requireOnline: true }
    );
    assert.equal(push.ok, true);
    assert.equal(push.pushed, 1);
    assert.equal(pluDb.has(9), true);
  } finally {
    await new Promise((resolve) => sock.close(() => resolve()));
  }
});
