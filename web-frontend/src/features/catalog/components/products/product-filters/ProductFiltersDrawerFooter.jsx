export default function ProductFiltersDrawerFooter({ t, onReset, onApply }) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
      <button
        type="button"
        onClick={onReset}
        className="admin-btn-secondary px-4 py-2 text-sm"
      >
        {t('products.filters.reset')}
      </button>
      <button
        type="button"
        onClick={onApply}
        className="admin-btn-primary px-4 py-2 text-sm"
      >
        {t('common.apply')}
      </button>
    </div>
  );
}
