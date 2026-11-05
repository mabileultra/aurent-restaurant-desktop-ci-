import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'lucide-react';
import { showOnScreenKeyboard } from '../../utils/onScreenKeyboard';

export default function OnScreenKeyboardButton({
  variant = 'header',
  className = '',
  title,
  onBeforeShow,
}) {
  const { t } = useTranslation();

  const handleClick = useCallback(async () => {
    onBeforeShow?.();
    await showOnScreenKeyboard();
  }, [onBeforeShow]);

  const label = t('common.onScreenKeyboard');

  if (variant === 'bottom-nav') {
    return (
      <button
        type="button"
        className={`cashier-bottom-nav__btn cashier-bottom-nav__btn--keyboard${className ? ` ${className}` : ''}`}
        onClick={handleClick}
        title={title ?? label}
        aria-label={label}
      >
        <Keyboard size={20} strokeWidth={2} aria-hidden />
        <span>
          <span className="cashier-bottom-nav__keyboard-label">ABC</span>
          {' '}
          {t('common.keyboardWord')}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`on-screen-keyboard-btn on-screen-keyboard-btn--${variant}${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      title={title ?? label}
      aria-label={label}
    >
      <Keyboard size={18} strokeWidth={2} aria-hidden />
      <span>ABC</span>
    </button>
  );
}
