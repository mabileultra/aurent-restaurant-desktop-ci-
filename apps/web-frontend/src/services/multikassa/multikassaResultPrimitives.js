export function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function maybeParseJson(value) {
  if (typeof value !== 'string') return value;
  const s = value.trim();
  if (!s) return value;
  const looksJson =
    (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
  if (!looksJson) return value;
  try {
    return JSON.parse(s);
  } catch {
    return value;
  }
}

export function unwrapRoot(raw) {
  const parsed = maybeParseJson(raw);
  if (!isPlainObject(parsed)) return parsed;
  const nested =
    parsed.data ?? parsed.Data ?? parsed.result ?? parsed.Result ?? parsed.response ?? parsed.Response;
  const nestedParsed = maybeParseJson(nested);
  if (isPlainObject(nestedParsed) || Array.isArray(nestedParsed)) return nestedParsed;
  return parsed;
}

export function pick(obj, keys) {
  if (!isPlainObject(obj)) return null;
  for (const key of keys) {
    const value = obj[key];
    if (value == null) continue;
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

export function deepPick(node, keys, depth = 0) {
  if (!isPlainObject(node) || depth > 6) return null;
  const direct = pick(node, keys);
  if (direct) return direct;
  for (const value of Object.values(node)) {
    const parsed = maybeParseJson(value);
    if (isPlainObject(parsed)) {
      const nested = deepPick(parsed, keys, depth + 1);
      if (nested) return nested;
    }
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const nested = deepPick(maybeParseJson(item), keys, depth + 1);
        if (nested) return nested;
      }
    }
  }
  return null;
}
