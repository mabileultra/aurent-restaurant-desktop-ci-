'use strict';
const os = require('os');

function localIpv4Subnets() {
  const ifaces = os.networkInterfaces();
  const out = [];
  for (const list of Object.values(ifaces || {})) {
    for (const row of list || []) {
      if (!row || row.internal || row.family !== 'IPv4') continue;
      const parts = String(row.address || '').split('.').map(Number);
      if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) continue;
      out.push({ base: `${parts[0]}.${parts[1]}.${parts[2]}`, self: row.address });
    }
  }
  return out;
}

module.exports = { localIpv4Subnets };
