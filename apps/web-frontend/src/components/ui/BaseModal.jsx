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
  open,
  isOpen,
  title,
  subtitle,
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
  const isEffectiveOpen = open !== undefined ? Boolean(open) : (isOpen !== undefined ? Boolean(isOpen) : true);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isEffectiveOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEffectiveOpen]);

  useEffect(() => {
    if (!isEffectiveOpen) return undefined;

    // Auto-focus dialog container on mount for a11y focus management
    const focusTimer = setTimeout(() => {
      if (!dialogRef.current) return;
      if (document.activeElement && dialogRef.current.contains(document.activeElement)) {
        return;
      }
      const autoFocusEl = dialogRef.current.querySelector('[data-autofocus], [autofocus]');
      const firstFormInput = dialogRef.current.querySelector(
        'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]):not([aria-hidden="true"]), textarea:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]), select:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])'
      );
      const firstFocusable = autoFocusEl || firstFormInput || dialogRef.current.querySelector('button:not([disabled])');
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        dialogRef.current.focus();
      }
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [isEffectiveOpen]);

  if (!isEffectiveOpen) return null;

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
            <div className="min-w-0 pr-2">
              {title && (
                <h2
                  id="base-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
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
