/** Вставка символа в input / textarea / contenteditable. */
export function insertIntoTextTarget(target, text) {
  if (!target || !text) return;

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    const next = `${target.value.slice(0, start)}${text}${target.value.slice(end)}`;
    target.value = next;
    const caret = start + text.length;
    target.setSelectionRange?.(caret, caret);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  if (target.isContentEditable) {
    document.execCommand('insertText', false, text);
  }
}

export function backspaceInTextTarget(target) {
  if (!target) return;

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    if (start !== end) {
      const next = `${target.value.slice(0, start)}${target.value.slice(end)}`;
      target.value = next;
      target.setSelectionRange?.(start, start);
    } else if (start > 0) {
      const next = `${target.value.slice(0, start - 1)}${target.value.slice(start)}`;
      target.value = next;
      target.setSelectionRange?.(start - 1, start - 1);
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (target.isContentEditable) {
    document.execCommand('delete', false, null);
  }
}
