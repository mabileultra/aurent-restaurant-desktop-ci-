const { randomUUID } = require('crypto');
const os = require('os');
const { readUserConfig, writeUserConfig } = require('../config/desktopConfig');

function getOrCreateDeviceId() {
  const user = readUserConfig() || {};
  if (user.deviceId && String(user.deviceId).trim()) {
    return String(user.deviceId).trim();
  }
  const deviceId = randomUUID();
  writeUserConfig({ deviceId });
  return deviceId;
}

function getTerminalIdentity() {
  return {
    deviceId: getOrCreateDeviceId(),
    workstationName: os.hostname(),
    equipmentModel: 'Aurent Desktop',
    equipmentSerial: null,
    fiscalCardId: null,
  };
}

module.exports = { getOrCreateDeviceId, getTerminalIdentity };
