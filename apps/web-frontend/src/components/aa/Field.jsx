import React from 'react';
import clsx from 'clsx';

/**
 * Aurent Admin — Field konteyneri.
 * aa-components.css dagi .aa-field, .aa-label, .aa-help, .aa-error sinflaridan foydalanadi.
 */
export default function Field({
  id,
  label,
  optional = false,
  help,
  error,
  children,
  className,
  ...props
}) {
  const helpId = id && help ? `${id}-help` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className={clsx('aa-field', className)} {...props}>
      {label ? (
        <label htmlFor={id} className="aa-label">
          {label}
          {optional ? <span className="aa-label__opt"> (ixtiyoriy)</span> : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <div id={errorId} className="aa-error" role="alert">
          <span>{error}</span>
        </div>
      ) : help ? (
        <div id={helpId} className="aa-help">
          {help}
        </div>
      ) : null}
    </div>
  );
}
