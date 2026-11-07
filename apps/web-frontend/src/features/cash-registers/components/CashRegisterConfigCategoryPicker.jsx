import React from 'react';
import { BaseSelect } from '../../../components/ui';

export default function CashRegisterConfigCategoryPicker({
  t,
  categories = [],
  categoryIds,
  setCategoryIds,
  pickCategoryId,
  setPickCategoryId,
  availableCategories = [],
  selectedCategories = [],
  addPickedCategory,
  removeCategory,
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        {t('cashRegisters.configCategoriesLabel')}
      </div>
      <div className="flex flex-wrap gap-2">
        <BaseSelect
          className="min-w-0 flex-1"
          value={pickCategoryId}
          onChange={(e) => setPickCategoryId(e.target.value)}
          disabled={availableCategories.length === 0}
          placeholder={t('cashRegisters.configSelectCategory')}
          options={[
            { value: '', label: t('cashRegisters.configSelectCategory') },
            ...availableCategories.map((c) => ({
              value: String(c.id),
              label: c.name,
            })),
          ]}
        />
        <button
          type="button"
          onClick={addPickedCategory}
          disabled={!pickCategoryId}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('cashRegisters.configAddCategory')}
        </button>
      </div>

      <div className="crc-modal__categories-grid">
        <div className="crc-modal__category-panel">
          <div className="crc-modal__category-panel-title">
            {t('cashRegisters.configAvailableCategories')}
          </div>
          <div className="crc-modal__category-panel-body">
            {categories.length === 0 ? (
              <p className="crc-modal__empty">{t('cashRegisters.configEmptyCategories')}</p>
            ) : availableCategories.length === 0 ? (
              <p className="crc-modal__empty">{t('cashRegisters.configNoCategoriesLeft')}</p>
            ) : (
              availableCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="crc-modal__category-item crc-modal__category-item--add"
                  onClick={() => setCategoryIds((prev) => new Set(prev).add(c.id))}
                >
                  <span className="truncate">+ {c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="crc-modal__category-panel">
          <div className="crc-modal__category-panel-title">
            {t('cashRegisters.configSelectedCategories')}
          </div>
          <div className="crc-modal__category-panel-body">
            {selectedCategories.length === 0 ? (
              <p className="crc-modal__empty">{t('cashRegisters.configPickCategoryHint')}</p>
            ) : (
              selectedCategories.map((c) => (
                <div key={c.id} className="crc-modal__category-item">
                  <span className="truncate">{c.name}</span>
                  <button
                    type="button"
                    className="shrink-0 text-red-600 hover:text-red-700"
                    onClick={() => removeCategory(c.id)}
                    aria-label={t('common.delete')}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
