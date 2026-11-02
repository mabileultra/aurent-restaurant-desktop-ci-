import { useRef, useCallback } from 'react';
import { generateIdempotencyKey, IDEMPOTENCY_HEADER } from '../utils/idempotencyKey';

/**
 * Bitta foydalanuvchi amali (forma saqlash, to'lov qilish) doirasida
 * barqaror Idempotency Key boshqarish hooki (P0).
 * Tarmoq uzilishi yoki timeout sababli foydalanuvchi qayta bosganda
 * aynan BIR XIL kalit yuborilishini ta'minlaydi.
 */
export function useActionIdempotencyKey() {
  const keyRef = useRef(null);

  const getKey = useCallback(() => {
    if (!keyRef.current) {
      keyRef.current = generateIdempotencyKey();
    }
    return keyRef.current;
  }, []);

  const resetKey = useCallback(() => {
    keyRef.current = null;
  }, []);

  const getHeaders = useCallback(() => {
    return {
      [IDEMPOTENCY_HEADER]: getKey(),
    };
  }, [getKey]);

  return {
    getKey,
    resetKey,
    getHeaders,
  };
}
