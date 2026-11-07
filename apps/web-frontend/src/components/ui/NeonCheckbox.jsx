import React from 'react';

/**
 * NeonCheckbox — Aurent POS glowing animated neon checkbox.
 */
export default function NeonCheckbox({
  checked = false,
  onChange,
  disabled = false,
  size = 22,
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
    <label
      className={`neon-checkbox ${disabled ? 'neon-checkbox--disabled' : ''} ${className}`}
      style={{ '--size': `${size}px` }}
      title={title}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        aria-label={ariaLabel}
      />
      <div className="neon-checkbox__frame">
        <div className="neon-checkbox__box">
          <div className="neon-checkbox__check-container">
            <svg viewBox="0 0 24 24" className="neon-checkbox__check" aria-hidden="true">
              <path d="M3,12.5l7,7L21,5" />
            </svg>
          </div>
          <div className="neon-checkbox__glow" />
          <div className="neon-checkbox__borders">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="neon-checkbox__effects">
          <div className="neon-checkbox__particles">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>
          <div className="neon-checkbox__rings">
            <div className="ring" />
            <div className="ring" />
            <div className="ring" />
          </div>
          <div className="neon-checkbox__sparks">
            <span /><span /><span /><span />
          </div>
        </div>
      </div>
    </label>
  );
}
