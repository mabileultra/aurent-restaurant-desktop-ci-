/**
 * Klaviatura fokusini modal yoki yon panel (drawer) ichida ushlab turish yordamchisi (Focus Trap)
 *
 * @param {KeyboardEvent} e - Klaviatura hodisasi (keydown)
 * @param {HTMLElement|null} container - Modal yoki drawer ildiz elementi
 * @returns {boolean} - Agar fokus aylantirilgan bo'lsa true, aks holda false
 */
export function trapFocus(e, container) {
  if (!container || e?.key !== 'Tab') return false;

  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = typeof container.querySelectorAll === 'function'
    ? Array.from(container.querySelectorAll(focusableSelectors))
    : [];

  if (focusableElements.length === 0) {
    e.preventDefault?.();
    return true;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const currentActive = typeof document !== 'undefined' ? document.activeElement : e.target;

  if (e.shiftKey) {
    if (currentActive === firstElement || (container.contains && !container.contains(currentActive))) {
      e.preventDefault?.();
      lastElement?.focus?.();
      return true;
    }
  } else {
    if (currentActive === lastElement || (container.contains && !container.contains(currentActive))) {
      e.preventDefault?.();
      firstElement?.focus?.();
      return true;
    }
  }

  return false;
}
