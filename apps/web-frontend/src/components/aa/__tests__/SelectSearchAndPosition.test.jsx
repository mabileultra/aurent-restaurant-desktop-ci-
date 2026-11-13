// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import Select from '../Select';
import { calculateSelectPosition } from '../select/useSelectPosition';

describe('aa/Select Search, Keyboard, and Positioning', () => {
  afterEach(() => {
    cleanup();
  });

  const geoOptions = [
    { value: 'tas', label: 'Toshkent shahri' },
    { value: 'sam', label: 'Samarqand viloyati' },
    { value: 'fer', label: 'Farg‘ona viloyati' },
    { value: 'and', label: 'Andijon viloyati' },
    { value: 'bux', label: 'Buxoro viloyati' },
  ];

  it('filters options with "farg": shows only "Farg‘ona viloyati", no "Andijon viloyati"', async () => {
    const user = userEvent.setup();
    render(
      <Select
        id="geo-select-search"
        label="Viloyat"
        options={geoOptions}
        searchable
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('combobox', { name: /viloyat/i });
    await user.click(trigger);

    const searchInput = screen.getByRole('combobox', { name: 'Variantlarni qidirish' });
    expect(searchInput).toBeInTheDocument();

    // "farg" yozilganda input qiymati "farg" bo‘lib qoladi, tozalanib ketmaydi
    await user.type(searchInput, 'farg');
    expect(searchInput).toHaveValue('farg');

    // Ro‘yxatda faqat Farg‘ona viloyati bo‘ladi, Andijon yoki boshqalar yo‘q
    expect(screen.getByRole('option', { name: 'Farg‘ona viloyati' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Andijon viloyati' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Toshkent shahri' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Samarqand viloyati' })).not.toBeInTheDocument();
  });

  it('normalizes Uzbek apostrophe: "farg\'ona" finds "Farg‘ona viloyati"', async () => {
    const user = userEvent.setup();
    render(
      <Select
        id="geo-select-apostrophe"
        label="Viloyat"
        options={geoOptions}
        searchable
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('combobox', { name: /viloyat/i });
    await user.click(trigger);

    const searchInput = screen.getByRole('combobox', { name: 'Variantlarni qidirish' });
    await user.type(searchInput, "farg'ona");
    expect(searchInput).toHaveValue("farg'ona");

    expect(screen.getByRole('option', { name: 'Farg‘ona viloyati' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Samarqand viloyati' })).not.toBeInTheDocument();
  });

  it('moves active descendant exactly by 1 item on ArrowDown inside search input', async () => {
    const user = userEvent.setup();
    render(
      <Select
        id="geo-select-keyboard"
        label="Viloyat"
        options={geoOptions}
        searchable
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('combobox', { name: /viloyat/i });
    await user.click(trigger);

    const searchInput = screen.getByRole('combobox', { name: 'Variantlarni qidirish' });
    // Boshlang'ich tanlangan birinchi variant indeks 0: opt-0
    expect(searchInput).toHaveAttribute('aria-activedescendant', 'geo-select-keyboard-opt-0');

    // ArrowDown bitta bosilganda aynan ikkinchi variantga (opt-1) o'tadi, sakrab ketmaydi
    await user.keyboard('{ArrowDown}');
    expect(searchInput).toHaveAttribute('aria-activedescendant', 'geo-select-keyboard-opt-1');

    // Yana bir marta ArrowDown bosilsa, opt-2 ga o'tadi
    await user.keyboard('{ArrowDown}');
    expect(searchInput).toHaveAttribute('aria-activedescendant', 'geo-select-keyboard-opt-2');
  });

  it('shows "Hech narsa topilmadi" when no match and Enter does not select anything', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Select
        id="geo-select-empty"
        label="Viloyat"
        options={geoOptions}
        searchable
        onChange={handleChange}
      />
    );

    const trigger = screen.getByRole('combobox', { name: /viloyat/i });
    await user.click(trigger);

    const searchInput = screen.getByRole('combobox', { name: 'Variantlarni qidirish' });
    await user.type(searchInput, 'mavjud_emas_query_123');

    expect(screen.getByText('Hech narsa topilmadi')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);

    // Enter bosilganda hech narsa tanlanmasligi kerak
    await user.keyboard('{Enter}');
    expect(handleChange).not.toHaveBeenCalled();
    // Ro'yxat ochiq qoladi
    expect(screen.getByText('Hech narsa topilmadi')).toBeInTheDocument();
  });

  it('opens upward or clamps maxHeight when trigger is near the bottom of viewport', () => {
    // 1395x849 ekran o'lchami, trigger ekranning pastki qismida
    const triggerRect = {
      top: 800,
      bottom: 840,
      left: 100,
      width: 220,
      height: 40,
    };

    const position = calculateSelectPosition({
      triggerRect,
      viewportWidth: 1395,
      viewportHeight: 849,
      isSearchable: true,
    });

    // Pastda faqat 849 - 840 = 9px joy bor, shuning uchun panel TEPAGA ochiladi
    expect(position.placement).toBe('top');
    expect(position.bottom).toBeDefined();
    expect(position.top).toBeUndefined();
    // Tepada 800px joy yetarli, maxHeight 320px gacha bo'ladi
    expect(position.maxHeight).toBe(320);
    // Kenglik kamida 240px bo'lishi kerak
    expect(position.width).toBe(240);
  });

  it('clamps maxHeight if space is constrained both above and below', () => {
    // Kichik ekranda (masalan mobil yoki kam joy)
    const triggerRect = {
      top: 150,
      bottom: 190,
      left: 10,
      width: 200,
      height: 40,
    };

    const position = calculateSelectPosition({
      triggerRect,
      viewportWidth: 390,
      viewportHeight: 350,
      isSearchable: true,
    });

    // Qayerda ko'proq joy bo'lsa o'sha tomonga ochiladi va maxHeight qisqaradi
    expect(position.maxHeight).toBeLessThan(320);
    expect(position.width).toBe(240);
  });
});
