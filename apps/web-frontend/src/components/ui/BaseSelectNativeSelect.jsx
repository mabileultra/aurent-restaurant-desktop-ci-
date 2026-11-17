import React from 'react';
import { toOptionValue } from './baseSelectHelpers';

export default function BaseSelectNativeSelect({
  nativeRef,
  name,
  effectiveValue,
  disabled,
  isControlled,
  setUncontrolledValue,
  onChange,
  onBlur,
  hasEmptyOption,
  placeholder,
  options,
}) {
  return (
    <select
      ref={nativeRef}
      name={name}
      value={effectiveValue}
      disabled={disabled}
      className="base-select__native"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        const next = toOptionValue(event.target.value);
        if (!isControlled) {
          setUncontrolledValue(next);
        }
        onChange?.(event);
      }}
      onBlur={onBlur}
    >
      {hasEmptyOption ? null : <option value="">{placeholder || ''}</option>}
      {options.map((option, index) => (
        <option
          key={`${toOptionValue(option.value)}-${index}`}
          value={toOptionValue(option.value)}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}
