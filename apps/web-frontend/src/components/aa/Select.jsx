import React, { forwardRef } from 'react';
import clsx from 'clsx';
import Field from './Field';

/**
 * Aurent Admin — Select komponenti.
 * aa-components.css dagi .aa-select sinflaridan foydalanadi.
 */
const Select = forwardRef(function Select(
  {
    id,
    label,
    optional = false,
    help,
    error,
    disabled = false,
    options,
    children,
    className,
    ...props
  },
  ref
) {
  const hasField = Boolean(label || help || error);
  const helpId = id && help ? `${id}-help` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;
  const describedBy = errorId || helpId || undefined;

  const selectElement = (
    <select
      ref={ref}
      id={id}
      disabled={disabled}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={describedBy}
      className={clsx('aa-select', className)}
      {...props}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );

  if (hasField) {
    return (
      <Field id={id} label={label} optional={optional} help={help} error={error}>
        {selectElement}
      </Field>
    );
  }

  return selectElement;
});

export default Select;
