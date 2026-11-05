/** Активное поле ввода для экранной клавиатуры. */
export function getActiveTextInput() {
  const el = document.activeElement;
  if (!el) return null;
  if (el instanceof HTMLInputElement) {
    const type = (el.type || 'text').toLowerCase();
    if (type === 'hidden' || type === 'checkbox' || type === 'radio' || type === 'file') return null;
    if (el.disabled || el.readOnly) return null;
    return el;
  }
  if (el instanceof HTMLTextAreaElement && !el.disabled && !el.readOnly) {
    return el;
  }
  if (el.isContentEditable) return el;
  return null;
}

export function rememberKeyboardTarget() {
  return getActiveTextInput();
}

export function focusKeyboardTarget(target) {
  if (!target || typeof target.focus !== 'function') return false;
  try {
    target.focus({ preventScroll: true });
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const len = target.value?.length ?? 0;
      target.setSelectionRange?.(len, len);
    }
    return true;
  } catch {
    return false;
  }
}
