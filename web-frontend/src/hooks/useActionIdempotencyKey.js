import { useRef, useCallback } from 'react';
import { generateIdempotencyKey, IDEMPOTENCY_HEADER } from '../utils/idempotencyKey';

/**
 * Bitta foydalanuvchi amali (forma saqlash, to'lov qilish) doirasida
 * barqaror Idempotency Key boshqarish hooki (P0).
 * Agar payloadSignature berilsa va u o'zgarsa (masalan, summa yoki amal turi),
 * yangi kalit talab qilinishi uchun eski kalit avtomatik bekor qilinadi.
 */
export function useActionIdempotencyKey(payloadSignature = null) {
  const keyRef = useRef(null);
  const signatureRef = useRef(payloadSignature);

  if (payloadSignature !== null && payloadSignature !== signatureRef.current) {
    keyRef.current = null;
    signatureRef.current = payloadSignature;
  }

  const getKey = useCallback(() => {
    if (!keyRef.current) {
      keyRef.current = generateIdempotencyKey();
    }
    return keyRef.current;
  }, []);

  const resetKey = useCallback(() => {
    keyRef.current = null;
    signatureRef.current = null;
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
