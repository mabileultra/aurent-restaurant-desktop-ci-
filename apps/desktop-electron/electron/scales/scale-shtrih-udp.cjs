'use strict';
/**
 * Фасад ШТРИХ-ПРИНТ UDP: пакеты + push/probe/poller.
 * @see scale-shtrih-packet.cjs, scale-shtrih-udp-io.cjs, scale-shtrih-udp-bind.cjs
 */
const {
  DEFAULT_UDP_PORT,
  DEFAULT_PASSWORD,
  DEFAULT_LOCAL_UDP_PORT,
  encodeWin1251Padded,
  encodeUintLe,
  buildPluWritePacket,
  buildWeightRequestPacket,
  parseScaleReply,
  parseShtrihWeightReply,
  resultText,
} = require('./scale-shtrih-packet.cjs');
const {
  createShtrihWeightPoller,
  pushViaUdp,
  pushViaTcp,
  probeShtrihUdp,
} = require('./scale-shtrih-udp-io.cjs');

function candidatePorts(udpPort) {
  const primary = Number(udpPort) || DEFAULT_UDP_PORT;
  const ports = [primary];
  if (primary !== DEFAULT_UDP_PORT) ports.push(DEFAULT_UDP_PORT);
  return ports;
}

/**
 * Выгрузка PLU. Успех — только код 0. Сначала UDP (local 2000), иначе TCP.
 * opts.requireOnline — сначала probe 0x11 (по умолчанию true).
 */
async function pushPluToShtrih(items, opts = {}) {
  const host = String(opts.host || '').trim();
  const udpPort = Number(opts.udpPort) || DEFAULT_UDP_PORT;
  if (!host) {
    return { ok: false, message: 'Не указан IP весов. Aurent → Весы → Ethernet → сохраните IP.' };
  }
  const list = Array.isArray(items) ? items.filter((row) => row && row.plu) : [];
  if (!list.length) {
    return { ok: false, message: 'Нет товаров с PLU для выгрузки' };
  }

  if (opts.requireOnline !== false) {
    const health = await probeShtrihUdp(host, udpPort, opts.probeTimeoutMs || 900);
    if (!health.ok) {
      return {
        ok: false,
        pushed: 0,
        host,
        udpPort,
        message:
          `Нет связи с ${host}:${udpPort} (${health.error || 'fail'}). `
          + 'Проверьте Ethernet, UDP 1111, firewall и что ПК шлёт с порта 2000.',
      };
    }
  }

  const packets = [];
  const errors = [];
  const password = opts.password || DEFAULT_PASSWORD;
  for (const row of list) {
    try {
      packets.push({ plu: row.plu, buf: buildPluWritePacket(row, { password }) });
    } catch (err) {
      errors.push({ plu: row.plu, error: err?.message || String(err) });
    }
  }
  if (!packets.length) {
    return { ok: false, message: 'Не удалось собрать пакеты PLU', errors };
  }

  const notes = [];
  for (const port of candidatePorts(udpPort)) {
    for (const via of [pushViaUdp, pushViaTcp]) {
      let attempt;
      try {
        attempt = await via(host, port, packets);
      } catch (err) {
        notes.push(`${host}:${port} — ${err?.message || err}`);
        continue;
      }
      if (attempt.answered && attempt.ok) {
        return {
          ok: true,
          pushed: attempt.pushed,
          skipped: errors.length,
          host,
          udpPort: port,
          transport: attempt.transport,
          errors: errors.length ? errors : undefined,
          hint: `PLU записаны в память (${attempt.transport.toUpperCase()} ${host}:${port}). Наберите номер PLU на весах.`,
        };
      }
      if (attempt.answered) {
        return {
          ok: false,
          pushed: attempt.pushed || 0,
          host,
          udpPort: port,
          message: attempt.message,
          errors: errors.length ? errors : undefined,
        };
      }
      if (attempt.message) notes.push(attempt.message);
    }
  }

  return {
    ok: false,
    pushed: 0,
    host,
    udpPort,
    message: notes[0] || `Весы ${host} не подтвердили запись. Ethernet, UDP 1111, пароль ${password}.`,
    errors: errors.length ? errors : undefined,
  };
}

module.exports = {
  DEFAULT_UDP_PORT,
  DEFAULT_PASSWORD,
  DEFAULT_LOCAL_UDP_PORT,
  encodeWin1251Padded,
  encodeUintLe,
  buildPluWritePacket,
  buildWeightRequestPacket,
  parseScaleReply,
  parseShtrihWeightReply,
  resultText,
  pushPluToShtrih,
  probeShtrihUdp,
  createShtrihWeightPoller,
};
