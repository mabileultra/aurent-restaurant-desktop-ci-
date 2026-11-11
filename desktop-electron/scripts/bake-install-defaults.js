#!/usr/bin/env node
/** Пишет electron/config/installDefaults.baked.js из CI env (lab host). */
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '../electron/config/installDefaults.baked.js');
const host = String(process.env.AURENT_DEFAULT_HOST || '').trim();
const webPort = String(process.env.AURENT_DEFAULT_WEB_PORT || '80').trim() || '80';
const apiPort = String(process.env.AURENT_DEFAULT_API_PORT || '8080').trim() || '8080';

const body = host
  ? `module.exports = ${JSON.stringify({ host, webPort, apiPort }, null, 2)};\n`
  : 'module.exports = null;\n';

fs.writeFileSync(out, body, 'utf8');
console.log(`[bake-install-defaults] ${host || '(prod defaults)'}`);
