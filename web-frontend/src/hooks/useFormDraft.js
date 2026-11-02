import { useEffect, useRef, useCallback } from 'react';

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmPassword',
  'newPassword',
  'pin',
  'pinCode',
  'token',
  'secret',
]);

/**
 * Forma qoralamasidan maxfiy ma'lumotlarni (parol, PIN) tozalash (P0)
 */
export function sanitizeDraftData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeDraftData(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_KEYS.has(key) ||
      lowerKey.includes('password') ||
      lowerKey.includes('pincode') ||
      lowerKey === 'pin'
    ) {
      continue;
    }
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      sanitized[key] = sanitizeDraftData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Uzun formalarda internet uzilganda yoki tasodifiy sahifa yangilanganda
 * kiritilgan ma'lumotlar yo'qolmasligi uchun vaqtincha saqlash hooki (P2)
 */
export function useFormDraft(draftKey, formData, onRestore) {
  const isRestoredRef = useRef(false);

  // 1. Dastlabki yuklanishda saqlangan qoralama (draft) ni tiklash
  useEffect(() => {
    if (!draftKey || isRestoredRef.current || typeof window === 'undefined') return;
    try {
      const saved = window.sessionStorage.getItem(`draft_${draftKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          isRestoredRef.current = true;
          onRestore?.(parsed);
        }
      }
    } catch {
      // sessionStorage ruxsatsiz yoki xatolik bo'lsa xavfsiz o'tkazib yuborish
    }
  }, [draftKey, onRestore]);

  // 2. Ma'lumot o'zgarganda qoralamani avtomatik yangilash (debounced, parolsiz)
  useEffect(() => {
    if (!draftKey || !formData || typeof window === 'undefined') return undefined;

    const timer = setTimeout(() => {
      try {
        const safeData = sanitizeDraftData(formData);
        window.sessionStorage.setItem(`draft_${draftKey}`, JSON.stringify(safeData));
      } catch {
        // quota exceeded yoki boshqa xato
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [draftKey, formData]);

  // 3. Forma muvaffaqiyatli saqlangandan so'ng qoralamani tozalash funksiyasi
  const clearDraft = useCallback(() => {
    if (!draftKey || typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(`draft_${draftKey}`);
      isRestoredRef.current = false;
    } catch {
      // ignore
    }
  }, [draftKey]);

  return { clearDraft };
}
