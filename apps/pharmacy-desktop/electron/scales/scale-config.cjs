/**
 * Настройки весов в общем config.json (рядом с принтерами станций).
 * Пишем только scale*-поля через writeUserConfig — принтеры не затираем.
 */
const { readUserConfig, writeUserConfig } = require('../config/desktopConfig');
const { normalizeHostList } = require('./scale-hosts.cjs');

function readScaleSettings() {
  const cfg = readUserConfig() || {};
  const transport = String(cfg.scaleTransport || '').toLowerCase() === 'ethernet'
    ? 'ethernet'
    : 'com';
  const hosts = normalizeHostList(cfg);
  const primary = hosts[0] || null;
  return {
    transport,
    port: String(cfg.scalePort || '').trim(),
    baudRate: Number(cfg.scaleBaudRate || 9600),
    host: String(cfg.scaleHost || primary?.host || '').trim(),
    tcpPort: Number(cfg.scaleTcpPort || primary?.udpPort || 1111) || 1111,
    hosts,
    family: String(cfg.scaleFamily || (transport === 'ethernet' ? 'family-shtrih-print' : 'weight-generic')).trim(),
    mock: cfg.scaleMock === true,
    stableOnly: cfg.scaleStableOnly !== false,
  };
}

function writeScaleSettings(patch) {
  const current = readUserConfig() || {};
  const scalePatch = {};

  if (typeof patch?.scaleTransport === 'string') {
    scalePatch.scaleTransport = patch.scaleTransport.toLowerCase() === 'ethernet' ? 'ethernet' : 'com';
  }
  if (typeof patch?.scalePort === 'string') scalePatch.scalePort = patch.scalePort.trim();
  if (patch?.scaleBaudRate != null) scalePatch.scaleBaudRate = Number(patch.scaleBaudRate) || 9600;
  if (typeof patch?.scaleHost === 'string') scalePatch.scaleHost = patch.scaleHost.trim();
  if (patch?.scaleTcpPort != null) scalePatch.scaleTcpPort = Number(patch.scaleTcpPort) || 1111;
  if (typeof patch?.scaleFamily === 'string') scalePatch.scaleFamily = patch.scaleFamily.trim();
  if (typeof patch?.scaleMock === 'boolean') scalePatch.scaleMock = patch.scaleMock;
  if (typeof patch?.scaleStableOnly === 'boolean') scalePatch.scaleStableOnly = patch.scaleStableOnly;

  if (Array.isArray(patch?.scaleHosts)) {
    const list = normalizeHostList({ scaleHosts: patch.scaleHosts });
    scalePatch.scaleHosts = list;
    if (list.length) {
      scalePatch.scaleHost = list[0].host;
      scalePatch.scaleTcpPort = list[0].udpPort;
      scalePatch.scaleTransport = 'ethernet';
      if (!scalePatch.scaleFamily && !current.scaleFamily) {
        scalePatch.scaleFamily = 'family-shtrih-print';
      }
    }
  }

  if (typeof patch?.scaleHost === 'string' && patch.scaleHost.trim()) {
    scalePatch.scaleTransport = 'ethernet';
    if (!scalePatch.scaleFamily && !current.scaleFamily) {
      scalePatch.scaleFamily = 'family-shtrih-print';
    }
    const host = patch.scaleHost.trim();
    const udpPort = Number(patch.scaleTcpPort ?? current.scaleTcpPort) || 1111;
    const label = String(patch.scaleHostLabel || '').trim();
    const existing = normalizeHostList({ ...current, ...scalePatch }).filter(
      (h) => !(h.host === host && h.udpPort === udpPort)
    );
    existing.unshift({ host, udpPort, label });
    scalePatch.scaleHosts = existing;
    scalePatch.scaleHost = host;
    scalePatch.scaleTcpPort = udpPort;
  }

  if (
    typeof patch?.scalePort === 'string'
    && patch.scalePort.trim()
    && !patch?.scaleHost
    && !patch?.scaleHosts
  ) {
    if (scalePatch.scaleTransport !== 'ethernet' && current.scaleTransport !== 'ethernet') {
      scalePatch.scaleTransport = 'com';
    }
  }

  writeUserConfig(scalePatch);
  return readScaleSettings();
}

module.exports = { readScaleSettings, writeScaleSettings, normalizeHostList };
