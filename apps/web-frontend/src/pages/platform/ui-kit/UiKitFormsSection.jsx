import React, { useState } from 'react';
import { Field, Input, SearchInput, Select } from '../../../components/aa';

/**
 * UI-Kit: Formalar, maydonlar va qidiruv bo‘limi.
 */
export default function UiKitFormsSection() {
  const [searchValue, setSearchValue] = useState('');
  const [selectValue, setSelectValue] = useState('tashkent');

  const regionOptions = [
    { value: 'tashkent', label: 'Toshkent shahri' },
    { value: 'samarkand', label: 'Samarqand viloyati' },
    { value: 'fergana', label: 'Farg‘ona viloyati' },
    { value: 'andijan', label: 'Andijon viloyati' },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-aa-section-title font-semibold text-aa-ink">4. Formalar (Input, Select, SearchInput, Field)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          id="ui-company-name"
          label="Kompaniya nomi"
          placeholder="«Aurent MChJ»"
          help="Rasmiy yuridik nomi"
        />

        <Input
          id="ui-stir"
          label="STIR raqami"
          placeholder="123456789"
          error="STIR 9 ta raqamdan iborat bo‘lishi lozim"
        />

        <Input
          id="ui-optional-field"
          label="Qo‘shimcha izoh"
          optional
          placeholder="Ixtiyoriy sharh..."
        />

        <Select
          id="ui-region"
          label="Hududni tanlang"
          options={regionOptions}
          value={selectValue}
          onChange={(e) => setSelectValue(e.target.value)}
        />

        <SearchInput
          id="ui-search"
          label="Tezkor qidiruv"
          placeholder="Kompaniya yoki STIR bo‘yicha..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />

        <Input
          id="ui-disabled-input"
          label="Bloklangan maydon"
          disabled
          value="O‘zgartirib bo‘lmaydi"
        />
      </div>

      <div className="max-w-md pt-2">
        <Field id="ui-custom-field" label="Maxsus Field wrapper" help="Field komponenti yordamida har qanday bolani o‘rash mumkin">
          <div className="p-2.5 rounded-aa-md border border-aa-line bg-aa-surface-sunken text-aa-ink-muted text-sm">
            Maxsus element konteyner ichida
          </div>
        </Field>
      </div>
    </section>
  );
}
