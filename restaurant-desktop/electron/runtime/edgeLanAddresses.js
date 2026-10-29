const os = require('os');

/** Private IPv4s phones can use on restaurant Wi‑Fi (skip link-local / docker). */
function listLanIpv4() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces || {})) {
    for (const row of ifaces[name] || []) {
      if (row.family !== 'IPv4' && row.family !== 4) continue;
      if (row.internal) continue;
      const ip = String(row.address || '');
      if (!ip || ip.startsWith('169.254.')) continue;
      out.push(ip);
    }
  }
  return [...new Set(out)];
}

function primaryLanIpv4() {
  const all = listLanIpv4();
  const pref = all.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip));
  return pref || all[0] || null;
}

module.exports = { listLanIpv4, primaryLanIpv4 };
