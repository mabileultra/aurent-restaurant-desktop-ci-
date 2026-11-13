import { useEffect, useRef } from 'react';

/**
 * Drawer yoki modal ichidagi klaviatura hodisalarini (Escape, Tab focus-trap) boshqaruvchi toza funksiya.
 */
export function handleDrawerKeyDown(e, { onClose, container, activeElement }) {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    onClose?.();
    return;
  }

  if (e.key === 'Tab' && container) {
    const focusables = container.querySelectorAll
      ? container.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      : [];
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = activeElement || (typeof document !== 'undefined' ? document.activeElement : null);

    if (e.shiftKey && current === first) {
      e.preventDefault();
      last?.focus?.();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first?.focus?.();
    }
  }
}

/**
 * useDrawerFocusTrap — Drawer/Modal uchun fokus qopqoni va accessibility hooki.
 * - Ochilganda fokusni birinchi kiritish maydoniga o‘tkazadi;
 * - Tab orqali fokusni konteyner ichida aylantiradi (focus trap);
 * - Esc bosilganda formani yopadi;
 * - Yopilganda fokusni ochgan elementga qaytaradi;
 * - Ochiq turganda orqa sahifa scroll’ini muzlatadi.
 */
export function useDrawerFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null);
  const prevActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    prevActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const firstInput = containerRef.current.querySelector(
        'input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled])'
      );
      if (firstInput && typeof firstInput.focus === 'function') {
        firstInput.focus();
      } else if (containerRef.current.focus) {
        containerRef.current.focus();
      }
    }, 15);

    const onKeyDown = (e) => {
      handleDrawerKeyDown(e, {
        onClose,
        container: containerRef.current,
        activeElement: document.activeElement,
      });
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
      if (prevActiveElementRef.current && typeof prevActiveElementRef.current.focus === 'function') {
        prevActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return containerRef;
}
