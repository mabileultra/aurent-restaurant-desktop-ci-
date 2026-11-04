import { BaseSelect } from '../../../../../components/ui';
import { productFiltersInputCls } from '../../../utils/productFiltersDrawerUi';

export default function ProductFiltersFields({
  t,
  filters,
  onChange,
  categories,
  stores,
  filterFields = [],
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  const setAttribute = (fieldKey, value) =>
    onChange({
      ...filters,
      attributes: { ...(filters.attributes ?? {}), [fieldKey]: value },
    });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <BaseSelect
        label={t('products.filters.ikpuStatus')}
        value={filters.ikpuStatus}
        onChange={(e) => set('ikpuStatus', e.target.value)}
        options={[
          { value: 'ALL', label: t('products.filters.ikpuAll') },
          { value: 'UNKNOWN', label: t('products.filters.ikpuUnknown') },
          { value: 'VALID', label: t('products.filters.ikpuValid') },
          { value: 'INVALID', label: t('products.filters.ikpuInvalid') },
        ]}
      />
      <BaseSelect
        label={t('products.filters.store')}
        value={filters.storeId}
        onChange={(e) => set('storeId', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          ...stores.map((s) => ({ value: String(s.id), label: s.name })),
        ]}
      />
      <div>
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.barcode')}
        </label>
        <input
          className={productFiltersInputCls}
          value={filters.barcode}
          onChange={(e) => set('barcode', e.target.value)}
        />
      </div>
      <BaseSelect
        label={t('products.filters.category')}
        value={filters.categoryId}
        onChange={(e) => set('categoryId', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          ...categories.map((c) => ({ value: String(c.id), label: c.name })),
        ]}
      />
      {filterFields.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
            {t('products.filters.businessFields')}
          </p>
          {filterFields.map((field) => (
            <BaseSelect
              key={field.fieldKey}
              label={field.label}
              value={filters.attributes?.[field.fieldKey] ?? ''}
              onChange={(e) => setAttribute(field.fieldKey, e.target.value)}
              placeholder={t('products.filters.any')}
              options={[
                { value: '', label: t('products.filters.any') },
                ...(field.options ?? []).map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
            />
          ))}
        </div>
      ) : null}
      <BaseSelect
        label={t('products.filters.soldByPiece')}
        value={filters.soldIndividually}
        onChange={(e) => set('soldIndividually', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          { value: 'true', label: t('products.filters.yes') },
          { value: 'false', label: t('products.filters.no') },
        ]}
      />
      <BaseSelect
        label={t('products.filters.marked')}
        value={filters.markedProduct}
        onChange={(e) => set('markedProduct', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          { value: 'true', label: t('products.filters.yes') },
          { value: 'false', label: t('products.filters.no') },
        ]}
      />
      <BaseSelect
        label={t('products.filters.deleted')}
        value={filters.deletedScope}
        onChange={(e) => set('deletedScope', e.target.value)}
        options={[
          { value: 'ACTIVE', label: t('products.filters.notDeleted') },
          { value: 'DELETED', label: t('products.filters.deletedOnly') },
          { value: 'ALL', label: t('products.filters.allRecords') },
        ]}
      />
    </div>
  );
}
