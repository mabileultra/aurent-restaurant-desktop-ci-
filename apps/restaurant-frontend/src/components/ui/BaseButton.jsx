import clsx from 'clsx';

const VARIANT = {
  primary: 'base-btn--primary',
  secondary: 'base-btn--secondary',
  danger: 'base-btn--danger',
  ghost: 'base-btn--ghost',
};

const SIZE = {
  sm: 'base-btn--sm',
  md: 'base-btn--md',
  lg: 'base-btn--lg',
};

/** Единая кнопка ресторанного SPA. */
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
      className={clsx('base-btn', VARIANT[variant], SIZE[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
