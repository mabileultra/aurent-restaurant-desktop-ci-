import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformTimePicker from './PlatformTimePicker';
import PlatformTimePickerDropdown from './PlatformTimePickerDropdown';

describe('PlatformTimePicker', () => {
  it('renders trigger button with formatted value', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformTimePicker, { value: '14:30' })
    );

    expect(html).toContain('14:30');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('renders disabled state correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformTimePicker, { value: '09:00', disabled: true })
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('opacity-50');
  });

  it('renders dropdown with dual columns and presets', () => {
    const dropdownHtml = renderToStaticMarkup(
      React.createElement(PlatformTimePickerDropdown, {
        selectedHour: '10',
        selectedMinute: '15',
        presets: ['09:00', '12:00', '18:00'],
        onSelectHour: vi.fn(),
        onSelectMinute: vi.fn(),
        onSelectPreset: vi.fn(),
        onSelectNow: vi.fn(),
        onClose: vi.fn(),
      })
    );

    expect(dropdownHtml).toContain('Tezkor vaqtlar');
    expect(dropdownHtml).toContain('09:00');
    expect(dropdownHtml).toContain('12:00');
    expect(dropdownHtml).toContain('18:00');
    expect(dropdownHtml).toContain('Soat');
    expect(dropdownHtml).toContain('Daqiqa');
    expect(dropdownHtml).toContain('Hozir');
    expect(dropdownHtml).toContain('Tayyor');
  });

  it('highlights the selected hour and minute in the dropdown', () => {
    const dropdownHtml = renderToStaticMarkup(
      React.createElement(PlatformTimePickerDropdown, {
        selectedHour: '14',
        selectedMinute: '30',
        presets: ['14:30'],
        onSelectHour: vi.fn(),
        onSelectMinute: vi.fn(),
        onSelectPreset: vi.fn(),
        onSelectNow: vi.fn(),
        onClose: vi.fn(),
      })
    );

    // Selected hour should have aria-pressed="true"
    expect(dropdownHtml).toMatch(/aria-pressed="true"[^>]*>14<\/button>/);
    // Selected minute should have aria-pressed="true"
    expect(dropdownHtml).toMatch(/aria-pressed="true"[^>]*>30<\/button>/);
  });
});
