import clsx from 'clsx';
import Spinner from './Spinner';
import { useOnlineActionGuard } from '../../hooks/useOnlineActionGuard';

const VARIANT_CLS = {
  primary: 'ui-btn-primary',
  secondary: 'ui-btn-secondary',
  ghost: 'ui-btn-ghost',
  danger: 'ui-btn-danger',
  'danger-solid': 'ui-btn-danger-solid',
};

const SIZE_CLS = {
  sm: 'ui-btn-sm',
  md: '',
  pos: 'ui-btn-pos',
};

export default function BaseButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  requiresOnline = false,
  title,
  className,
  children,
  ...props
}) {
  const { isActionBlocked, blockReason } = useOnlineActionGuard();
  const isEffectivelyBlocked = requiresOnline && isActionBlocked;
  const effectiveDisabled = disabled || loading || isEffectivelyBlocked;
  const effectiveTitle = isEffectivelyBlocked
    ? title
      ? `${title} (${blockReason})`
      : blockReason
    : title;

  const spinnerVariant = variant === 'primary' || variant === 'danger-solid' ? 'white' : 'emerald';
  const spinnerSize = size === 'sm' ? 'xs' : 'sm';

  return (
    <button
      type={type}
      disabled={effectiveDisabled}
      title={effectiveTitle}
      aria-disabled={effectiveDisabled ? 'true' : undefined}
      className={clsx(
        size === 'pos' ? 'ui-btn-pos' : 'ui-btn',
        VARIANT_CLS[variant] || VARIANT_CLS.primary,
        size !== 'pos' && SIZE_CLS[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={spinnerSize} variant={spinnerVariant} />}
      {children}
    </button>
  );
}
