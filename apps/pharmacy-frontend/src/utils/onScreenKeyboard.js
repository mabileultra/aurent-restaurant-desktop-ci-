import { useVirtualKeyboardStore } from '../store/virtualKeyboardStore';
import { focusKeyboardTarget, getActiveTextInput, rememberKeyboardTarget } from './onScreenKeyboardTarget';

let probeEl = null;

function ensureProbeInput() {
  if (typeof document === 'undefined') return null;
  if (probeEl?.isConnected) return probeEl;

  probeEl = document.createElement('input');
  probeEl.type = 'text';
  probeEl.inputMode = 'text';
  probeEl.autocomplete = 'off';
  probeEl.autocapitalize = 'off';
  probeEl.spellcheck = false;
  probeEl.setAttribute('aria-hidden', 'true');
  probeEl.tabIndex = -1;
  probeEl.className = 'on-screen-keyboard-probe';
  document.body.appendChild(probeEl);
  return probeEl;
}

async function tryNativeVirtualKeyboard() {
  if (typeof navigator === 'undefined') return false;
  const vk = navigator.virtualKeyboard;
  if (!vk || typeof vk.show !== 'function') return false;
  try {
    vk.overlaysContent = true;
    await vk.show();
    return Boolean(vk.boundingRect && vk.boundingRect.height > 0);
  } catch {
    return false;
  }
}

async function tryDesktopKeyboard() {
  if (typeof window === 'undefined') return false;
  if (typeof window.desktopCashier?.showOnScreenKeyboard !== 'function') return false;
  try {
    await window.desktopCashier.showOnScreenKeyboard();
    return true;
  } catch {
    return false;
  }
}

export async function showOnScreenKeyboard(preferredTarget = null) {
  const target = preferredTarget || getActiveTextInput() || rememberKeyboardTarget();

  if (await tryDesktopKeyboard()) {
    if (target) focusKeyboardTarget(target);
    return;
  }

  if (target) {
    focusKeyboardTarget(target);
  } else {
    const probe = ensureProbeInput();
    if (probe) {
      probe.style.cssText =
        'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;border:0;padding:0;margin:0;';
      probe.value = '';
      probe.focus({ preventScroll: true });
      probe.click?.();
    }
  }

  if (await tryNativeVirtualKeyboard()) {
    return;
  }

  useVirtualKeyboardStore.getState().show(target);
}

export function hideOnScreenKeyboard() {
  useVirtualKeyboardStore.getState().hide();
}
