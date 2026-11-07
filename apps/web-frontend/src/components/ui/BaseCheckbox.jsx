import React, { forwardRef, useId } from 'react';

/**
 * BaseCheckbox (Animated Checkbox 19)
 * Global custom animated checkbox supporting both controlled and uncontrolled (React Hook Form) usage.
 */
const BaseCheckbox = forwardRef(function BaseCheckbox(
  {
    checked,
    defaultChecked,
    onChange,
    onClick,
    onBlur,
    disabled = false,
    size = 18,
    className = '',
    id,
    name,
    value,
    ariaLabel,
    title,
    label,
    labelClassName = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `cb-19-${generatedId}`;

  const isControlled = typeof checked !== 'undefined';
  const checkedClass = isControlled && checked ? 'checked' : '';

  const inputProps = {
    ref,
    type: 'checkbox',
    id: inputId,
    name,
    value,
    disabled,
    onChange: disabled ? undefined : onChange,
    onClick: disabled ? (e) => e.preventDefault() : onClick,
    onBlur,
    'aria-label': ariaLabel || rest['aria-label'],
    title,
    ...rest,
  };

  if (isControlled) {
    inputProps.checked = checked;
    if (!onChange && typeof rest.readOnly === 'undefined') {
      inputProps.readOnly = true;
    }
  } else if (typeof defaultChecked !== 'undefined') {
    inputProps.defaultChecked = defaultChecked;
  }

  const checkboxBox = (
    <span
      className={`checkbox-wrapper-19 shrink-0 ${disabled ? 'checkbox-wrapper-19--disabled' : ''} ${className}`}
      style={{ '--checkbox-height': `${size}px` }}
      title={title}
    >
      <input {...inputProps} />
      <label className={`check-box ${checkedClass}`} htmlFor={inputId} />
    </span>
  );

  if (!label) {
    return checkboxBox;
  }

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${labelClassName}`}
    >
      {checkboxBox}
      <span>{label}</span>
    </label>
  );
});

export default BaseCheckbox;
