import React, { useEffect, useState } from 'react';
import { clampNum, snapStep } from './labelLayoutUtils';

export function formatNumValue(value, step) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const s = Number(step) || 1;
  if (s < 1) {
    const decimals = (String(s).split('.')[1] || '').length || 1;
    return String(Number(n.toFixed(decimals)));
  }
  return String(n);
}

export function isPartialNumberInput(raw) {
  const s = String(raw ?? '').trim().replace(',', '.');
  return s === '' || s === '-' || s === '.' || s === '-.' || /^-?\d+\.$/.test(s);
}

export default function ShelfLabelNumField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  className = 'w-20',
}) {
  const [draft, setDraft] = useState(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(null);
  }, [value, focused]);

  const commit = (raw) => {
    const trimmed = String(raw ?? '').trim().replace(',', '.');
    if (isPartialNumberInput(trimmed)) {
      onChange(snapStep(clampNum(value, min, max), step));
      return;
    }
    onChange(snapStep(clampNum(trimmed, min, max), step));
  };

  const displayValue = focused && draft !== null ? draft : formatNumValue(value, step);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        className={`rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white ${className}`}
        value={displayValue}
        onFocus={() => {
          setFocused(true);
          setDraft(formatNumValue(value, step));
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          commit(draft);
          setFocused(false);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </div>
  );
}
