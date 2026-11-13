import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import Field from './Field';

/**
 * Aurent Admin — SearchInput komponenti.
 * aa-components.css dagi .aa-input-icon va .aa-input sinflaridan foydalanadi.
 */
const SearchInput = forwardRef(function SearchInput(
  {
    id,
    label,
    optional = false,
    help,
    error,
    disabled = false,
    placeholder = 'Qidirish...',
    className,
    ...props
  },
  ref
) {
  const hasField = Boolean(label || help || error);
  const helpId = id && help ? `${id}-help` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;
  const describedBy = errorId || helpId || undefined;

  const searchElement = (
    <div className="aa-input-icon">
      <Search className="aa-icon" aria-hidden="true" />
      <input
        ref={ref}
        id={id}
        type="search"
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={clsx('aa-input', className)}
        {...props}
      />
    </div>
  );

  if (hasField) {
    return (
      <Field id={id} label={label} optional={optional} help={help} error={error}>
        {searchElement}
      </Field>
    );
  }

  return searchElement;
});

export default SearchInput;
