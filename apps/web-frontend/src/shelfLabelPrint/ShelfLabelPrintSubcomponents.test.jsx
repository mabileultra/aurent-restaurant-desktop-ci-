// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ShelfLabelNumField, { formatNumValue, isPartialNumberInput } from './ShelfLabelNumField';
import ShelfLabelPresetPicker, { formatPresetSize } from './ShelfLabelPresetPicker';

afterEach(cleanup);

describe('ShelfLabelPrint subcomponents', () => {
  const mockT = (key, opt) => opt?.defaultValue || key;

  describe('ShelfLabelNumField utilities', () => {
    it('formatNumValue formats number with proper decimals', () => {
      expect(formatNumValue(5, 1)).toBe('5');
      expect(formatNumValue(2.5, 0.1)).toBe('2.5');
      expect(formatNumValue(null, 1)).toBe('');
    });

    it('isPartialNumberInput identifies partial inputs', () => {
      expect(isPartialNumberInput('-')).toBe(true);
      expect(isPartialNumberInput('.')).toBe(true);
      expect(isPartialNumberInput('12.')).toBe(true);
      expect(isPartialNumberInput('12.5')).toBe(false);
    });
  });

  describe('ShelfLabelNumField component', () => {
    it('renders label and handles change/blur', () => {
      const onChange = vi.fn();
      render(
        <ShelfLabelNumField
          label="Test Offset"
          value={2}
          onChange={onChange}
          min={0}
          max={10}
          step={0.5}
        />
      );

      expect(screen.getByText('Test Offset')).toBeDefined();
      const input = screen.getByDisplayValue('2');
      fireEvent.change(input, { target: { value: '3.5' } });
      fireEvent.blur(input);
      expect(onChange).toHaveBeenCalledWith(3.5);
    });
  });

  describe('ShelfLabelPresetPicker', () => {
    it('formats preset size correctly', () => {
      expect(formatPresetSize({ paperWmm: 58, paperHmm: 40 })).toBe('58 × 40 мм');
      expect(formatPresetSize({ paperWmm: 58.5, paperHmm: 40 })).toBe('58.50 × 40 мм');
    });

    it('renders presets and triggers applyPreset on click', () => {
      const applyPreset = vi.fn();
      render(
        <ShelfLabelPresetPicker
          activeId="58x40"
          applyPreset={applyPreset}
          t={mockT}
        />
      );

      const btn = screen.getAllByRole('button')[0];
      fireEvent.click(btn);
      expect(applyPreset).toHaveBeenCalled();
    });
  });
});
