const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function pickFreePort(fromPort) {
  for (let p = fromPort; p < fromPort + 12; p += 1) {
    if (!(await portOpen(p))) return p;
  }
  throw new Error(`No free port near ${fromPort}`);
}

describe('port recovery', () => {
  it('picks a free port when the preferred one is busy', async () => {
    const server = net.createServer();
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const busy = server.address().port;
    const free = await pickFreePort(busy);
    assert.notEqual(free, busy);
    assert.equal(await portOpen(free), false);
    await new Promise((r) => server.close(r));
  });
});
