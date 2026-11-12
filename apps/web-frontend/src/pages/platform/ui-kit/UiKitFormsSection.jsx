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

  const allRegions = [
    { value: 'tas_sh', label: 'Toshkent shahri' },
    { value: 'tas_v', label: 'Toshkent viloyati' },
    { value: 'sam', label: 'Samarqand viloyati' },
    { value: 'fer', label: 'Farg‘ona viloyati' },
    { value: 'and', label: 'Andijon viloyati' },
    { value: 'nam', label: 'Namangan viloyati' },
    { value: 'bux', label: 'Buxoro viloyati' },
    { value: 'nav', label: 'Navoiy viloyati' },
    { value: 'xor', label: 'Xorazm viloyati' },
    { value: 'sur', label: 'Surxondaryo viloyati' },
    { value: 'qash', label: 'Qashqadaryo viloyati' },
    { value: 'jiz', label: 'Jizzax viloyati' },
    { value: 'sir', label: 'Sirdaryo viloyati' },
    { value: 'qor', label: 'Qoraqalpog‘iston Respublikasi' },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-aa-section-title font-semibold text-aa-ink">
        4. Formalar (Input, Select, SearchInput, Field)
      </h2>

      {/* Inputlar */}
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

      {/* Select holatlari */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-aa-ink">
          Select komponenti holatlari (Custom Dropdown)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            id="ui-select-selected"
            label="1. Tanlangan (standart)"
            options={regionOptions}
            value={selectValue}
            onChange={(val) => setSelectValue(val)}
          />

          <Select
            id="ui-select-placeholder"
            label="2. Yopiq (placeholder)"
            options={regionOptions}
            value=""
            placeholder="Viloyatni tanlang"
            onChange={() => {}}
          />

          <Select
            id="ui-select-searchable"
            label="3. Qidiruvli (14 ta hudud)"
            options={allRegions}
            searchable
            placeholder="Viloyatni qidiring..."
            value=""
            onChange={() => {}}
          />

          <Select
            id="ui-select-error"
            label="4. Xatolik holati"
            options={regionOptions}
            value=""
            error="Hududni tanlash majburiy"
            onChange={() => {}}
          />

          <Select
            id="ui-select-disabled"
            label="5. Bloklangan (disabled)"
            options={regionOptions}
            value="tashkent"
            disabled
            onChange={() => {}}
          />

          <Select
            id="ui-select-long-text"
            label="6. Uzun matn (ellipsis)"
            options={[
              {
                value: 'long-1',
                label: 'Toshkent shahar Mirzo Ulug‘bek tumani Mustaqillik shoh ko‘chasi 14-bino, 4-qavat',
              },
              { value: 'short-1', label: 'Oddiy qisqa variant' },
            ]}
            value="long-1"
            onChange={() => {}}
          />

          <Select
            id="ui-select-empty"
            label="7. Natijasiz qidiruv (Hech narsa topilmadi)"
            options={[]}
            searchable
            placeholder="Variantlar mavjud emas"
            onChange={() => {}}
          />
        </div>
      </div>

      <div className="max-w-md pt-2">
        <Field
          id="ui-custom-field"
          label="Maxsus Field wrapper"
          help="Field komponenti yordamida har qanday bolani o‘rash mumkin"
        >
          <div className="p-2.5 rounded-aa-md border border-aa-line bg-aa-surface-sunken text-aa-ink-muted text-sm">
            Maxsus element konteyner ichida
          </div>
        </Field>
      </div>
    </section>
  );
}
