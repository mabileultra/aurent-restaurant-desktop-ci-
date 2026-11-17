/** Нормализуем TXID к десятичной строке (как ждёт swagger form-поле). */
export function normalizeReceiptTxid(txid) {
  if (txid == null) return null;
  const raw = String(txid).trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  return raw;
}

export function pickCI(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  const map = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const real = map.get(String(key).toLowerCase());
    if (real == null) continue;
    const value = obj[real];
    if (value != null && value !== '') return value;
  }
  return null;
}

export function unwrapTxidPayload(raw, depth = 0) {
  if (raw == null || depth > 4) return raw;
  if (typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const direct = pickCI(raw, 'TXID', 'Txid', 'txid');
  if (direct != null) return raw;
  for (const key of ['result', 'data', 'payload', 'response', 'value', 'body', 'content']) {
    const inner = pickCI(raw, key);
    if (inner == null) continue;
    if (typeof inner === 'number' || typeof inner === 'string') return inner;
    if (typeof inner === 'object') return unwrapTxidPayload(inner, depth + 1);
  }
  return raw;
}

/** Ответ GetTXID: число, строка или объект с TXID. */
export function parseReceiptTxid(raw) {
  const unwrapped = unwrapTxidPayload(raw);
  if (unwrapped == null) return null;
  if (typeof unwrapped === 'number' || typeof unwrapped === 'string') {
    return normalizeReceiptTxid(unwrapped);
  }
  if (typeof unwrapped === 'object') {
    const value = pickCI(unwrapped, 'TXID', 'Txid', 'txid', 'Id', 'id');
    return normalizeReceiptTxid(value);
  }
  return null;
}

export function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
  }
  return null;
}

/** Рекурсивно собирает FactoryID из ответа List (массив, обёртки, вложенные объекты). */
export function collectFactoryIds(raw, depth = 0, out = []) {
  if (raw == null || depth > 6) return out;
  if (typeof raw === 'string') {
    const id = raw.trim();
    // FactoryID в доке — 36 символов; допускаем чуть короче на всякий случай.
    if (id.length >= 20) out.push(id);
    return out;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    out.push(String(raw));
    return out;
  }
  if (Array.isArray(raw)) {
    for (const entry of raw) collectFactoryIds(entry, depth + 1, out);
    return out;
  }
  if (typeof raw === 'object') {
    const id = pick(raw, 'FactoryID', 'FactoryId', 'factoryId', 'factoryID');
    if (id != null) {
      const trimmed = String(id).trim();
      if (trimmed) out.push(trimmed);
    }
    for (const value of Object.values(raw)) {
      if (value && (typeof value === 'object' || typeof value === 'string')) {
        collectFactoryIds(value, depth + 1, out);
      }
    }
  }
  return out;
}

/** Ответ `/FiscalDrive/List` → уникальные FactoryID. */
export function parseFiscalDriveFactoryIds(raw) {
  return [...new Set(collectFactoryIds(raw))];
}

/** Ответ `/FiscalDrive/Info/{FactoryID}` → поля, которые нужны настройкам кассы. */
export function summarizeFiscalDriveInfo(raw) {
  const info = raw && typeof raw === 'object' ? raw : {};
  const terminalId = pick(info, 'TerminalID', 'TerminalId', 'terminalId', 'terminalID');
  const version = pick(info, 'AppletVersion', 'Version', 'version', 'appletVersion');
  const locked = pick(info, 'Locked', 'locked');
  return {
    terminalId: terminalId != null ? String(terminalId).trim().toUpperCase() : null,
    version: version != null ? String(version) : null,
    locked: locked === true || locked === 'true' || locked === 1,
  };
}
