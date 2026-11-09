import React, { useState } from 'react';
import { motion } from 'motion/react';
import './RubberSegment.css';
import { SIZES } from './rubberSegmentConstants';
import { useRubberAnimation } from './useRubberAnimation';
import { useRubberDrag } from './useRubberDrag';

export default function RubberSegment({
  items = [],
  value,
  defaultValue,
  onChange,
  trackColor,
  thumbColor,
  textColor,
  activeTextColor,
  size = 'md',
  radius = 10,
  inset = 3,
  equalSlots = true,
  stretch = 100,
  squash = 3,
  speed = 1,
  glide = 75,
  draggable = true,
  /** Rubber spring on click/drag. Off = instant thumb jump (safer on heavy analytics pages). */
  physics = true,
  disabled = false,
  className = '',
  'aria-label': ariaLabel = 'Segmented control',
}) {
  const list = items.map((item) => (typeof item === 'string' ? { value: item, label: item } : item));
  const [inner, setInner] = useState(defaultValue ?? list[0]?.value);
  const current = value !== undefined ? value : inner;
  const index = Math.max(0, list.findIndex((item) => item.value === current));

  const animation = useRubberAnimation({
    list,
    index,
    value,
    onChange,
    setInner,
    radius,
    inset,
    equalSlots,
    size,
    stretch,
    squash,
    speed,
  });

  const drag = useRubberDrag({
    disabled,
    draggable: physics && draggable,
    reduce: animation.reduce,
    physics,
    index,
    list,
    inset,
    glide,
    animation,
  });

  const preset = SIZES[size] || SIZES.md;

  return (
    <div
      ref={animation.trackRef}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      data-equal={equalSlots ? '' : undefined}
      data-draggable={draggable && !disabled ? '' : undefined}
      className={`rubber-segment${className ? ` ${className}` : ''}`}
      style={{
        ...(trackColor ? { '--rs-track': trackColor } : {}),
        ...(thumbColor ? { '--rs-thumb': thumbColor } : {}),
        ...(textColor ? { '--rs-ink': textColor } : {}),
        ...(activeTextColor ? { '--rs-ink-active': activeTextColor } : {}),
        '--rs-radius': `${radius}px`,
        '--rs-inset': `${inset}px`,
        '--rs-thumb-radius': `${animation.thumbRadius}px`,
        '--rs-h': `${preset.height}px`,
        '--rs-font': `${preset.font}px`,
        '--rs-pad': `${preset.pad}px`,
        '--rs-min': `${preset.min}px`,
      }}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerUp}
      onPointerCancel={drag.handlePointerCancel}
      onLostPointerCapture={drag.handlePointerCancel}
    >
      {list.map((item, i) => (
        <button
          key={item.value}
          ref={(el) => {
            animation.itemRefs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={i === index}
          tabIndex={i === index ? 0 : -1}
          disabled={disabled}
          className="rubber-segment__item"
          onPointerDown={(e) => drag.handlePointerDown(e, i)}
          onKeyDown={drag.handleKeyDown}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
      <motion.div className="rubber-segment__thumb" aria-hidden="true" style={{ clipPath: animation.clipPath }}>
        {list.map((item) => (
          <span key={item.value} className="rubber-segment__item rubber-segment__copy">
            {item.icon}
            {item.label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
