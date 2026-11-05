import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import BaseButton from './BaseButton';

const SIZE_CLS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  /** Широкие мастера (импорт товаров и т.п.) */
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

    // Auto-focus dialog container on mount for a11y focus management
    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const autoFocusEl = dialogRef.current.querySelector('[data-autofocus], [autofocus]');
        const firstFormInput = dialogRef.current.querySelector(
          'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
        );
        const firstFocusable = autoFocusEl || firstFormInput || dialogRef.current.querySelector('button:not([disabled])');
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
        'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto',
        overlayClassName,
      )}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={clsx(
          'flex max-h-[min(90vh,42rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:!border-slate-800 dark:!bg-slate-900 text-slate-900 dark:text-slate-100 outline-none my-auto',
          SIZE_CLS[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'base-modal-title' : undefined}
      >
        {!hideHeader && (title || onClose) && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3.5 dark:border-slate-800">
            {title && (
              <h2
                id="base-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {title}
              </h2>
            )}
            {onClose && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:!bg-slate-800 transition"
                aria-label={closeLabel}
                title={closeLabel}
              >
                <X size={18} />
              </BaseButton>
            )}
          </div>
        )}

        <div className={clsx('min-h-0 flex-1 overflow-y-auto p-4 sm:p-6', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className={clsx('flex shrink-0 justify-end gap-2 border-t border-slate-200 px-4 sm:px-6 py-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50', footerClassName)}>
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
