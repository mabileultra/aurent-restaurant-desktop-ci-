import React, { forwardRef } from 'react';
import clsx from 'clsx';
import Field from './Field';

/**
 * Aurent Admin — Input komponenti.
 * aa-components.css dagi .aa-input sinflaridan foydalanadi.
 */
const Input = forwardRef(function Input(
  {
    id,
    label,
    optional = false,
    help,
    error,
    disabled = false,
    className,
    type = 'text',
    ...props
  },
  ref
) {
  const hasField = Boolean(label || help || error);
  const helpId = id && help ? `${id}-help` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;
  const describedBy = errorId || helpId || undefined;

  const inputElement = (
    <input
      ref={ref}
      id={id}
      type={type}
      disabled={disabled}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={describedBy}
      className={clsx('aa-input', className)}
      {...props}
    />
  );

  if (hasField) {
    return (
      <Field id={id} label={label} optional={optional} help={help} error={error}>
        {inputElement}
      </Field>
    );
  }

  return inputElement;
});

export default Input;
