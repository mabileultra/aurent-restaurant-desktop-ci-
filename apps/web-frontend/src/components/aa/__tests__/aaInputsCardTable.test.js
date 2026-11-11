import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Card from '../Card';
import KpiCard from '../KpiCard';
import Field from '../Field';
import Input from '../Input';
import Select from '../Select';
import SearchInput from '../SearchInput';
import Table from '../Table';

describe('AA Components: Card, KpiCard, Field, Input, Select, SearchInput, Table', () => {
  it('renders Card with header, subtitle, actions, and footer', () => {
    const htmlCard = renderToStaticMarkup(
      React.createElement(Card, {
        title: 'Statistika',
        subtitle: 'Oxirgi 30 kun',
        actions: React.createElement('button', null, 'Eksport'),
        footer: React.createElement('div', null, 'Yangilandi'),
      }, 'Kontent')
    );
    expect(htmlCard).toContain('aa-card');
    expect(htmlCard).toContain('aa-card__title');
    expect(htmlCard).toContain('Statistika');
    expect(htmlCard).toContain('Oxirgi 30 kun');
    expect(htmlCard).toContain('aa-card__foot');
  });

  it('renders KpiCard with states, fallback, delta, and split', () => {
    const htmlKpi = renderToStaticMarkup(
      React.createElement(KpiCard, {
        label: 'Umumiy tushum',
        value: '512,4 mln',
        unit: 'so‘m',
        size: 'lg',
        delta: { value: '12,4%', direction: 'up', text: 'o‘tgan oyga nisbatan' },
        split: [
          { value: 65, tone: 'success', label: 'Fiskal' },
          { value: 35, tone: 'danger', label: 'Fiskalsiz' },
        ],
      })
    );
    expect(htmlKpi).toContain('aa-kpi');
    expect(htmlKpi).toContain('aa-kpi__value--lg');
    expect(htmlKpi).toContain('512,4 mln');
    expect(htmlKpi).toContain('aa-delta--up');
    expect(htmlKpi).toContain('aa-kpi__bar');

    const htmlEmptyKpi = renderToStaticMarkup(
      React.createElement(KpiCard, { label: 'Aktivlar', value: null })
    );
    expect(htmlEmptyKpi).toContain('—');

    const htmlLoadingKpi = renderToStaticMarkup(
      React.createElement(KpiCard, { label: 'Yuklanmoqda', loading: true })
    );
    expect(htmlLoadingKpi).toContain('aa-skel');
  });

  it('renders Field, Input, Select, and SearchInput with accessible attributes', () => {
    const htmlInput = renderToStaticMarkup(
      React.createElement(Input, {
        id: 'comp-name',
        label: 'Kompaniya nomi',
        optional: true,
        error: 'Nom kiritilishi shart',
      })
    );
    expect(htmlInput).toContain('aa-field');
    expect(htmlInput).toContain('for="comp-name"');
    expect(htmlInput).toContain('(ixtiyoriy)');
    expect(htmlInput).toContain('aria-invalid="true"');
    expect(htmlInput).toContain('aria-describedby="comp-name-error"');
    expect(htmlInput).toContain('role="alert"');

    const htmlSelect = renderToStaticMarkup(
      React.createElement(Select, {
        id: 'region-select',
        label: 'Viloyat',
        options: [
          { value: 'sam', label: 'Samarqand' },
          { value: 'tosh', label: 'Toshkent' },
        ],
      })
    );
    expect(htmlSelect).toContain('aa-select');
    expect(htmlSelect).toContain('value="sam"');

    const htmlSearch = renderToStaticMarkup(
      React.createElement(SearchInput, { placeholder: 'Qidirish...' })
    );
    expect(htmlSearch).toContain('aa-input-icon');
    expect(htmlSearch).toContain('type="search"');
  });

  it('renders Table with sortable columns, rows, alignment, and pagination', () => {
    const columns = [
      { key: 'name', title: 'Nomi', sortable: true },
      { key: 'amount', title: 'Summa', align: 'right' },
    ];
    const rows = [
      { id: 1, name: 'Arent Retail', amount: '12 500 000 so‘m' },
    ];
    const pagination = { page: 1, totalPages: 3, totalItems: 25 };

    const htmlTable = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        sort: { key: 'name', order: 'asc' },
        pagination,
      })
    );
    expect(htmlTable).toContain('aa-table-wrap');
    expect(htmlTable).toContain('aa-table-scroll');
    expect(htmlTable).toContain('aria-sort="ascending"');
    expect(htmlTable).toContain('aa-col-num');
    expect(htmlTable).toContain('Arent Retail');
    expect(htmlTable).toContain('aa-pager');
    expect(htmlTable).toContain('aria-current="page"');
  });
});
