import React, { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Aurent Admin — Button komponenti.
 * aa-components.css dagi .aa-btn sinflaridan foydalanadi.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconOnly = false,
    loading = false,
    disabled = false,
    as: Component = 'button',
    children,
    className,
    type = 'button',
    ...props
  },
  ref
) {
  const isButton = Component === 'button';
  const isDisabled = disabled || loading;

  const btnClasses = clsx(
    'aa-btn',
    `aa-btn--${variant}`,
    size !== 'md' && `aa-btn--${size}`,
    iconOnly && 'aa-btn--icon',
    className
  );

  const componentProps = {
    ref,
    className: btnClasses,
    ...(isButton ? { type, disabled: isDisabled } : { 'aria-disabled': isDisabled }),
    ...(loading ? { 'aria-busy': 'true' } : {}),
    ...props,
  };

  return (
    <Component {...componentProps}>
      {loading ? (
        <span className="aa-spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="aa-icon flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {iconOnly ? null : children}
    </Component>
  );
});

export default Button;
