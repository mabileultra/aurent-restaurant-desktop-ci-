// Global keyboard-wedge barcode capture (USB/Bluetooth scanners act as keyboard + Enter).
import { useEffect, useRef } from 'react';

const MIN_CODE_LENGTH = 3;
const INTER_CHAR_MS = 80;
const BUFFER_RESET_MS = 200;

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

    const flush = () => {
      const code = buffer.trim();
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
        if (buffer.length >= MIN_CODE_LENGTH) {
          e.preventDefault();
          e.stopPropagation();
          if (onOtherTypingField) clearInputElement(target);
          flush();
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
      resetTimer = setTimeout(() => {
        if (buffer.length >= MIN_CODE_LENGTH) {
          const input = barcodeInputRef?.current;
          if (input instanceof HTMLInputElement && input.value) {
            clearInputElement(input);
          }
          flush();
        } else {
          clearBuffer();
        }
      }, BUFFER_RESET_MS);
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      clearBuffer();
    };
  }, [enabled, barcodeInputRef, alwaysCapture, autoFocus]);
}
