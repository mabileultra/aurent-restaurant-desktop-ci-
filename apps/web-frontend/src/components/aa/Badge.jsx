import React from 'react';
import clsx from 'clsx';

/**
 * Aurent Admin — Badge komponenti.
 * aa-components.css dagi .aa-badge sinflaridan foydalanadi.
 */
export default function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className,
  ...props
}) {
  const badgeClasses = clsx(
    'aa-badge',
    tone !== 'neutral' && `aa-badge--${tone}`,
    className
  );

  return (
    <span className={badgeClasses} {...props}>
      {dot ? <span className="aa-badge__dot" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}
