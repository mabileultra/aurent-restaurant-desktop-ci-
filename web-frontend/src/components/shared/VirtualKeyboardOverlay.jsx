import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Delete, CornerDownLeft } from 'lucide-react';
import { useVirtualKeyboardStore } from '../../store/virtualKeyboardStore';
import { backspaceInTextTarget, insertIntoTextTarget } from '../../utils/virtualKeyboardInput';
import { focusKeyboardTarget, getActiveTextInput } from '../../utils/onScreenKeyboardTarget';

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
  ['-', '=', '.', ',', '@'],
];

const ROWS_LATIN = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ['-', '=', '.', ',', '@'],
];

function resolveTarget(storedTarget) {
  return getActiveTextInput() || storedTarget;
}

function pickRows(language) {
  const lang = (language || '').toLowerCase();
  return lang.startsWith('ru') || lang.startsWith('uz') ? ROWS : ROWS_LATIN;
}

export default function VirtualKeyboardOverlay() {
  const { t, i18n } = useTranslation();
  const visible = useVirtualKeyboardStore((s) => s.visible);
  const storedTarget = useVirtualKeyboardStore((s) => s.target);
  const hide = useVirtualKeyboardStore((s) => s.hide);
  const rows = pickRows(i18n.language);

  useEffect(() => {
    if (!visible) return undefined;
    focusKeyboardTarget(resolveTarget(storedTarget));
    const onKeyDown = (e) => {
      if (e.key === 'Escape') hide();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, storedTarget, hide]);

  if (!visible) return null;

  const pressKey = (key) => {
    const target = resolveTarget(storedTarget);
    if (!target) return;
    focusKeyboardTarget(target);
    insertIntoTextTarget(target, key);
  };

  const pressBackspace = () => {
    const target = resolveTarget(storedTarget);
    if (!target) return;
    focusKeyboardTarget(target);
    backspaceInTextTarget(target);
  };

  const pressSpace = () => pressKey(' ');

  const pressEnter = () => {
    const target = resolveTarget(storedTarget);
    if (target instanceof HTMLTextAreaElement) {
      pressKey('\n');
      return;
    }
    target?.form?.requestSubmit?.();
    hide();
  };

  return createPortal(
    <div className="virtual-keyboard-dock" role="region" aria-label={t('common.onScreenKeyboard')}>
      <div className="virtual-keyboard-dock__panel">
        <header className="virtual-keyboard-dock__head">
          <span>{t('common.onScreenKeyboard')}</span>
          <button type="button" className="virtual-keyboard-dock__close" onClick={hide} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>
        <div className="virtual-keyboard-dock__rows">
          {rows.map((row) => (
            <div key={row.join('')} className="virtual-keyboard-dock__row">
              {row.map((key) => (
                <button key={key} type="button" className="virtual-keyboard-dock__key" onClick={() => pressKey(key)}>
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="virtual-keyboard-dock__row virtual-keyboard-dock__row--actions">
            <button type="button" className="virtual-keyboard-dock__key virtual-keyboard-dock__key--space" onClick={pressSpace}>
              {t('common.space')}
            </button>
            <button
              type="button"
              className="virtual-keyboard-dock__key"
              onClick={pressBackspace}
              aria-label={t('common.backspace')}
            >
              <Delete size={18} />
            </button>
            <button type="button" className="virtual-keyboard-dock__key virtual-keyboard-dock__key--enter" onClick={pressEnter}>
              <CornerDownLeft size={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
