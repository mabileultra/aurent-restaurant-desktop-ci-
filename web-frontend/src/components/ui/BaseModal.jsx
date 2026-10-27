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
}) {
  if (!open) return null;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4',
        overlayClassName,
      )}
    >
      <div className="flex min-h-full items-center justify-center">
      <div
        className={clsx(
          'flex max-h-[min(90vh,100%)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:!border-slate-800 dark:!bg-slate-900 text-slate-900 dark:text-slate-100',
          SIZE_CLS[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'base-modal-title' : undefined}
      >
        {!hideHeader && (title || onClose) && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            {title && (
              <h2
                id="base-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
            )}
            {onClose && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-auto p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:!bg-slate-800"
                aria-label="Close"
              >
                <X size={20} />
              </BaseButton>
            )}
          </div>
        )}
        <div className={clsx('min-h-0 flex-1 overflow-y-auto p-5', bodyClassName)}>{children}</div>
        {footer && (
          <div className={clsx('flex shrink-0 justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800', footerClassName)}>
            {footer}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
