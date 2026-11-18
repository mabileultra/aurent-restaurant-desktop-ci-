'use strict';
/**
 * UDP-сокет для ШТРИХ: драйвер Лайтбокс/Saby шлёт с локального порта 2000.
 * Если 2000 занят — fallback на ephemeral (bind 0).
 */
const dgram = require('dgram');
const { DEFAULT_LOCAL_UDP_PORT } = require('./scale-shtrih-packet.cjs');

function preferredLocalPort() {
  const fromEnv = Number(process.env.POS_SCALE_LOCAL_UDP_PORT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return DEFAULT_LOCAL_UDP_PORT;
}

/**
 * @returns {Promise<{ socket: import('dgram').Socket, localPort: number, preferred: boolean }>}
 */
function bindShtrihUdpSocket(opts = {}) {
  const want = opts.localPort == null ? preferredLocalPort() : Number(opts.localPort);
  const socket = dgram.createSocket('udp4');

  return new Promise((resolve, reject) => {
    const tryEphemeral = () => {
      const s2 = dgram.createSocket('udp4');
      s2.once('error', reject);
      s2.bind(0, () => {
        s2.removeListener('error', reject);
        s2.on('error', () => {});
        const addr = s2.address();
        resolve({ socket: s2, localPort: addr.port, preferred: false });
      });
    };

    socket.once('error', (err) => {
      try { socket.close(); } catch { /* ignore */ }
      if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES')) {
        tryEphemeral();
        return;
      }
      reject(err);
    });

    socket.bind(want, () => {
      socket.removeAllListeners('error');
      socket.on('error', () => {});
      const addr = socket.address();
      resolve({ socket, localPort: addr.port, preferred: addr.port === want });
    });
  });
}

module.exports = {
  preferredLocalPort,
  bindShtrihUdpSocket,
};
