import { forwardRef } from 'react';
import clsx from 'clsx';

const BaseInput = forwardRef(function BaseInput(
  {
    label,
    error,
    required,
    as: Component = 'input',
    className,
    id,
    ...props
  },
  ref
) {
  const fieldId = id || props.name;

  return (
    <div className="base-field">
      {label ? (
        <label htmlFor={fieldId} className="base-field__label">
          {required ? <span className="base-field__required">* </span> : null}
          {label}
        </label>
      ) : null}
      <Component
        ref={ref}
        id={fieldId}
        className={clsx('base-field__control', className)}
        {...props}
      />
      {error ? <p className="base-field__error">{error}</p> : null}
    </div>
  );
});

export default BaseInput;
