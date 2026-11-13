// @vitest-environment jsdom
import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import Select from '../Select';

describe('aa/Select component', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleOptions = [
    { value: 'tas', label: 'Toshkent shahri' },
    { value: 'sam', label: 'Samarqand viloyati' },
    { value: 'fer', label: 'Farg‘ona viloyati' },
    { value: 'and', label: 'Andijon viloyati', disabled: true },
  ];

  it('renders trigger with placeholder and opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(
      <Select
        id="test-select"
        label="Viloyat"
        placeholder="Viloyatni tanlang"
        options={sampleOptions}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('combobox', { name: /viloyat/i });
    expect(trigger).toHaveTextContent('Viloyatni tanlang');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Toshkent shahri' })).toBeInTheDocument();
  });

  it('selects option on click and calls onChange with value', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    function ControlledSelect() {
      const [val, setVal] = useState('');
      return (
        <Select
          id="test-select-2"
          label="Viloyat"
          value={val}
          options={sampleOptions}
          onChange={(v) => {
            setVal(v);
            handleChange(v);
          }}
        />
      );
    }

    render(<ControlledSelect />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    const option = screen.getByRole('option', { name: 'Samarqand viloyati' });
    await user.click(option);

    expect(handleChange).toHaveBeenCalledWith('sam');
    expect(trigger).toHaveTextContent('Samarqand viloyati');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape and stops propagation so parent Modal is not closed', async () => {
    const user = userEvent.setup();
    const handleModalClose = vi.fn();

    render(
      <div onKeyDown={(e) => {
        if (e.key === 'Escape') handleModalClose();
      }}>
        <Select
          id="escape-select"
          label="Viloyat"
          options={sampleOptions}
          searchable
          onChange={() => {}}
        />
      </div>
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(handleModalClose).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('respects disabled state and does not open when clicked', async () => {
    const user = userEvent.setup();
    render(
      <Select
        id="disabled-select"
        label="Bloklangan"
        disabled
        options={sampleOptions}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders error state with aria-invalid', () => {
    render(
      <Select
        id="error-select"
        label="Viloyat"
        error="Viloyatni tanlang"
        options={sampleOptions}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Viloyatni tanlang');
  });
});
