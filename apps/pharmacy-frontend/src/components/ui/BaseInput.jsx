import { forwardRef } from 'react';
import clsx from 'clsx';
import { fieldErrorCls, inputCls, labelCls } from './uiClasses';

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
  ref,
) {
  const fieldId = id || props.name;
  const isTextarea = Component === 'textarea';
  const isSelect = Component === 'select';

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className={labelCls}>
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <Component
        ref={ref}
        id={fieldId}
        aria-invalid={error ? 'true' : undefined}
        className={clsx(
          isTextarea ? 'ui-textarea' : isSelect ? 'ui-select' : inputCls,
          error && 'ui-input-error',
          className,
        )}
        {...props}
      />
      {error && <p className={fieldErrorCls}>{error}</p>}
    </div>
  );
});

export default BaseInput;
