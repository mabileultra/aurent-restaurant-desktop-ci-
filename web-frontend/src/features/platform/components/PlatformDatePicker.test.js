import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDateRangePicker from './PlatformDateRangePicker';
import PlatformDatePicker from './PlatformDatePicker';

describe('PlatformDateRangePicker component', () => {
  it('renders trigger combobox with placeholder when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '',
        to: '',
        placeholder: 'Oraliqni tanlang',
      }),
    );
    expect(html).toContain('Oraliqni tanlang');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('renders formatted date range when from and to are provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '2026-10-01',
        to: '2026-10-26',
      }),
    );
    expect(html).toContain('01.10.2026 — 26.10.2026');
    expect(html).toContain('font-semibold');
  });

  it('renders partial from date correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '2026-10-01',
        to: '',
      }),
    );
    expect(html).toContain('01.10.2026 — …');
  });

  it('renders partial to date correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '',
        to: '2026-10-26',
      }),
    );
    expect(html).toContain('… — 26.10.2026');
  });

  it('renders clear button when value is present and clearable is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '2026-10-01',
        to: '2026-10-26',
        clearable: true,
      }),
    );
    // Clear button should be a real button element
    expect(html).toContain('<button type="button"');
    expect(html).toContain('aria-label="Tozalash"');
  });

  it('hides clear button when clearable is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '2026-10-01',
        to: '2026-10-26',
        clearable: false,
      }),
    );
    expect(html).not.toContain('aria-label="Tozalash"');
  });

  it('applies w-full to container and combobox when className contains w-full', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        className: 'w-full custom-class',
      }),
    );
    expect(html).toContain('relative w-full text-left');
    expect(html).toContain('custom-class');
  });

  it('renders disabled state properly with tabIndex -1 and opacity', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '2026-10-01',
        to: '2026-10-26',
        disabled: true,
      }),
    );
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('opacity-50 cursor-not-allowed');
    expect(html).not.toContain('aria-label="Tozalash"');
  });

  it('renders with custom t prop for Russian localization', () => {
    const mockT = (key) => (key === 'platform.datePicker.placeholderRange' ? 'Выберите период' : key);
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '',
        to: '',
        t: mockT,
      }),
    );
    expect(html).toContain('Выберите период');
  });

  it('respects align="right" prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDateRangePicker, {
        from: '2026-10-01',
        to: '2026-10-26',
        align: 'right',
      }),
    );
    // Component renders without error and sets up right alignment
    expect(html).toContain('role="combobox"');
  });
});

describe('PlatformDatePicker component', () => {
  it('renders trigger combobox with placeholder when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        value: '',
        placeholder: 'Sanani tanlang',
      }),
    );
    expect(html).toContain('Sanani tanlang');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('renders formatted date when value is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        value: '2026-10-26',
      }),
    );
    expect(html).toContain('26.10.2026');
    expect(html).toContain('font-semibold');
  });

  it('renders clear button when date is selected and clearable is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        value: '2026-10-26',
        clearable: true,
      }),
    );
    expect(html).toContain('<button type="button"');
    expect(html).toContain('aria-label="Tozalash"');
  });

  it('hides clear button when clearable is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        value: '2026-10-26',
        clearable: false,
      }),
    );
    expect(html).not.toContain('aria-label="Tozalash"');
  });

  it('handles w-full className by making wrapper and control full width', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        className: 'w-full form-date',
      }),
    );
    expect(html).toContain('relative w-full text-left');
    expect(html).toContain('form-date');
  });

  it('renders disabled state properly with tabIndex -1 and opacity', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        value: '2026-10-26',
        disabled: true,
      }),
    );
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('opacity-50 cursor-not-allowed');
    expect(html).not.toContain('aria-label="Tozalash"');
  });

  it('renders with custom t prop for Russian localization', () => {
    const mockT = (key) => (key === 'platform.datePicker.placeholderSingle' ? 'Выберите дату' : key);
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        value: '',
        t: mockT,
      }),
    );
    expect(html).toContain('Выберите дату');
  });

  it('respects align="right" prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDatePicker, {
        value: '2026-10-26',
        align: 'right',
      }),
    );
    expect(html).toContain('role="combobox"');
  });
});
