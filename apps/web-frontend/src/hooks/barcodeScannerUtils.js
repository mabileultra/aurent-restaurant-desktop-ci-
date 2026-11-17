export const MIN_CODE_LENGTH = 3;
export const INTER_CHAR_MS = 80;
export const BUFFER_RESET_MS = 200;
/** Пауза между символами BT-сканера на POS часто > 80 мс. Ждём конец ввода в поле, не обрывок буфера. */
export const DEDICATED_IDLE_MS = 500;
/** Чистый EAN/цифры — короче idle (сканер часто без Enter). КМ/GS1 оставляем 500. */
export const DEDICATED_DIGIT_IDLE_MS = 160;

export function dedicatedIdleMsForBuffer(buffer) {
  const t = String(buffer || '').trim();
  if (/^\d{8,14}$/.test(t)) return DEDICATED_DIGIT_IDLE_MS;
  return DEDICATED_IDLE_MS;
}

export function fieldLooksLikeScan(value) {
  const t = String(value || '').trim();
  if (t.length < MIN_CODE_LENGTH) return false;
  if (/^\d+$/.test(t)) return true;
  if (t.includes('\u001d')) return true;
  if (/^01\d/.test(t)) return true;
  if (t.length >= 16 && /^[0-9A-Za-z]+$/.test(t)) return true;
  return false;
}

/**
 * Поле поиска хранит весь скан. Буфер клина после паузы > 80 мс — только хвост.
 * Для цифрового кода берём поле целиком. Имя товара в поле не подменяем хвостом.
 */
export function resolveScanCode(buffer, typed) {
  const fromBuffer = String(buffer || '').trim();
  const fromField = String(typed || '').trim();
  if (
    fieldLooksLikeScan(fromField)
    && fromField.length >= fromBuffer.length
  ) {
    return fromField;
  }
  return fromBuffer;
}

export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(el.isContentEditable);
}

export function clearInputElement(el) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) {
    setter.call(el, '');
  } else {
    el.value = '';
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export function isRefTarget(target, refs = []) {
  return refs.some((ref) => ref?.current && target === ref.current);
}
