import React from 'react';

/**
 * CircleToggleCheckbox — Animated 3D checkmark / cross toggle button.
 */
export default function CircleToggleCheckbox({
  checked = false,
  onChange,
  disabled = false,
  size = 24,
  className = '',
  id,
  name,
  ariaLabel,
  title,
}) {
  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) onChange(e);
  };

  return (
    <div
      className={`checkbox-wrapper-44 ${disabled ? 'checkbox-wrapper-44--disabled' : ''} ${className}`}
      style={{ '--cb-size': `${size}px` }}
      title={title}
    >
      <label className="toggleButton">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          aria-label={ariaLabel}
        />
        <div>
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <path
              transform="translate(-2.000000, -2.000000)"
              d="M14,24 L21,31 L39.7428882,11.5937758 C35.2809627,6.53125861 30.0333333,4 24,4 C12.95,4 4,12.95 4,24 C4,35.05 12.95,44 24,44 C35.05,44 44,35.05 44,24 C44,19.3 42.5809627,15.1645919 39.7428882,11.5937758"
            />
          </svg>
        </div>
      </label>
    </div>
  );
}
