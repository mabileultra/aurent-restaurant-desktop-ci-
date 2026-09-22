import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import BaseButton from './BaseButton';

const SIZE = {
  sm: 'base-modal--sm',
  md: 'base-modal--md',
  lg: 'base-modal--lg',
  xl: 'base-modal--xl',
};

export default function BaseModal({
  open = true,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  className,
  bodyClassName,
  overlayClassName,
  footerClassName,
  hideHeader = false,
  closeOnOverlay = true,
}) {
  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={clsx('base-modal-overlay', overlayClassName)}
      onClick={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={clsx('base-modal', SIZE[size], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'base-modal-title' : undefined}
      >
        {!hideHeader && (title || onClose) ? (
          <div className="base-modal__header">
            {title ? (
              <h2 id="base-modal-title" className="base-modal__title">
                {title}
              </h2>
            ) : null}
            {onClose ? (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </BaseButton>
            ) : null}
          </div>
        ) : null}
        <div className={clsx('base-modal__body', bodyClassName)}>{children}</div>
        {footer ? (
          <div className={clsx('base-modal__footer', footerClassName)}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
