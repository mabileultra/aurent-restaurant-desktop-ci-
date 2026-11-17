import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

const SIZE_CLS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  /** Wide wizards (product import, etc.) */
  full: 'max-w-[min(98vw,110rem)]',
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
  closeLabel = 'Close',
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const autoFocusEl = dialogRef.current.querySelector('[data-autofocus], [autofocus]');
        const firstFormInput = dialogRef.current.querySelector(
          'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])',
        );
        const firstFocusable =
          autoFocusEl || firstFormInput || dialogRef.current.querySelector('button:not([disabled])');
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const modalNode = (
    <div
      className={clsx(
        'ui-overlay z-[100] p-3 sm:p-4 overflow-y-auto',
        overlayClassName,
      )}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={clsx(
          'ui-modal-panel my-auto max-h-[min(90vh,42rem)] outline-none',
          SIZE_CLS[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'base-modal-title' : undefined}
      >
        {!hideHeader && (title || onClose) && (
          <div className="ui-modal-header">
            {title && (
              <h2 id="base-modal-title" className="ui-modal-title">
                {title}
              </h2>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ui-btn-icon ml-auto h-8 w-8"
                aria-label={closeLabel}
                title={closeLabel}
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}

        <div className={clsx('ui-modal-body', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className={clsx('ui-modal-footer', footerClassName)}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
}
