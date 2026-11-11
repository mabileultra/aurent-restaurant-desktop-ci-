import React from 'react';
import clsx from 'clsx';

/**
 * Aurent Admin — Skeleton komponenti.
 * aa-components.css dagi .aa-skel sinflaridan foydalanadi.
 */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  style,
  ...props
}) {
  const skelClasses = clsx(
    'aa-skel',
    `aa-skel--${variant}`,
    className
  );

  const customStyle = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...style,
  };

  return (
    <span
      className={skelClasses}
      style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
      aria-hidden="true"
      {...props}
    />
  );
}
