import clsx from 'clsx';

const VARIANT_CLS = {
  primary:
    'base-btn--primary bg-[color:var(--color-brand)] font-semibold text-[color:var(--color-brand-on)] hover:bg-[color:var(--color-brand-hover)] disabled:opacity-50',
  secondary:
    'border border-slate-300 bg-white font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  danger:
    'bg-red-600 font-semibold text-white hover:bg-red-700 disabled:opacity-50',
  ghost:
    'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
};

const SIZE_CLS = {
  sm: 'rounded-lg px-3 py-1.5 text-xs',
  md: 'rounded-lg px-4 py-2 text-sm',
};

export default function BaseButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed',
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
