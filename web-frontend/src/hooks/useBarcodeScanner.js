// Global keyboard-wedge barcode capture (USB/Bluetooth scanners act as keyboard + Enter).
import { useEffect, useRef } from 'react';

const MIN_CODE_LENGTH = 3;
const INTER_CHAR_MS = 80;
const BUFFER_RESET_MS = 200;
/** Пауза между символами BT-сканера на POS часто > 80 мс. Ждём конец ввода в поле, не обрывок буфера. */
const DEDICATED_IDLE_MS = 500;

function fieldLooksLikeScan(value) {
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

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(el.isContentEditable);
}

function clearInputElement(el) {
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

function isRefTarget(target, refs = []) {
  return refs.some((ref) => ref?.current && target === ref.current);
}

/**
 * @param {Object} opts
 * @param {boolean} opts.enabled
 * @param {(code: string) => void} opts.onScan
 * @param {React.RefObject<HTMLInputElement>} [opts.barcodeInputRef] — dedicated field; still receives focus on enable
 * @param {boolean} [opts.alwaysCapture] — capture scans even when focus is not on barcode field (POS mode)
 * @param {boolean} [opts.autoFocus=true] — focus barcode field when hook enables
 * @param {React.RefObject<HTMLInputElement>[]} [opts.passthroughInputRefs] — own fields (e.g. КМ): do not steal keys/focus
 */
export function useBarcodeScanner({
  enabled,
  onScan,
  barcodeInputRef,
  alwaysCapture = false,
  autoFocus = true,
  passthroughInputRefs = [],
}) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const passthroughRefsRef = useRef(passthroughInputRefs);
  passthroughRefsRef.current = passthroughInputRefs;

  useEffect(() => {
    if (!enabled) return undefined;

    if (autoFocus) {
      const active = document.activeElement;
      const onPassthrough = isRefTarget(active, passthroughRefsRef.current);
      if (!onPassthrough) {
        barcodeInputRef?.current?.focus();
      }
    }

    let buffer = '';
    let lastCharAt = 0;
    let resetTimer = null;

    const clearBuffer = () => {
      buffer = '';
      lastCharAt = 0;
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }
    };

    const submit = (code) => {
      clearBuffer();
      if (code.length >= MIN_CODE_LENGTH) {
        onScanRef.current(code);
      }
    };

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target;
      // Поле КМ (и др.) само принимает скан — глобальный wedge не трогаем.
      if (isRefTarget(target, passthroughRefsRef.current)) {
        return;
      }

      const onDedicatedBarcode =
        barcodeInputRef?.current && target === barcodeInputRef.current;
      const onOtherTypingField =
        alwaysCapture && isTypingTarget(target) && !onDedicatedBarcode;

      if (!alwaysCapture && isTypingTarget(target) && !onDedicatedBarcode) {
        return;
      }

      const now = Date.now();
      const wedgeActive = Boolean(lastCharAt && now - lastCharAt <= INTER_CHAR_MS);

      if (e.key === 'Enter') {
        const typed = onDedicatedBarcode && target instanceof HTMLInputElement ? target.value : '';
        const code = resolveScanCode(buffer, typed);
        if (code.length >= MIN_CODE_LENGTH) {
          e.preventDefault();
          e.stopPropagation();
          if (onOtherTypingField) clearInputElement(target);
          submit(code);
        } else {
          clearBuffer();
        }
        return;
      }

      if (e.key.length !== 1) return;

      if (lastCharAt && now - lastCharAt > INTER_CHAR_MS) {
        buffer = '';
      }

      const absorbWedge = onOtherTypingField && (buffer.length > 0 || wedgeActive);
      if (absorbWedge) {
        e.preventDefault();
        e.stopPropagation();
        if (buffer.length === 0 && target instanceof HTMLInputElement) {
          const leaked = target.value;
          if (leaked) buffer = leaked;
          clearInputElement(target);
        }
      }

      lastCharAt = now;
      buffer += e.key;

      if (resetTimer) clearTimeout(resetTimer);
      const idleMs = onDedicatedBarcode ? DEDICATED_IDLE_MS : BUFFER_RESET_MS;
      resetTimer = setTimeout(() => {
        const input = barcodeInputRef?.current;
        const dedicatedActive = Boolean(input && document.activeElement === input);
        const typed = dedicatedActive && input instanceof HTMLInputElement ? input.value : '';
        const code = resolveScanCode(buffer, typed);
        if (code.length >= MIN_CODE_LENGTH) {
          if (!dedicatedActive && input instanceof HTMLInputElement && input.value) {
            clearInputElement(input);
          }
          submit(code);
        } else {
          clearBuffer();
        }
      }, idleMs);
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      clearBuffer();
    };
  }, [enabled, barcodeInputRef, alwaysCapture, autoFocus]);
}
