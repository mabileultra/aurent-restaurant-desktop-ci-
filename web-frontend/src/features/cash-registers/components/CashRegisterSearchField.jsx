import { Filter, Plus } from 'lucide-react';
import PageSearchField from '../../../components/ui/PageSearchField';

export default function CashRegisterSearchField({
  value,
  onChange,
  placeholder,
  filterLabel,
  onOpenFilters,
  showFilter = true,
  addLabel,
  onAdd,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <PageSearchField
        value={value}
        onChange={(next) => onChange({ target: { value: next } })}
        placeholder={placeholder}
      />
      <div className="flex shrink-0 gap-2">
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 dark:border-emerald-600 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
          >
            <Plus size={16} />
            {addLabel}
          </button>
        ) : null}
        {showFilter ? (
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600"
          >
            <Filter size={16} />
            {filterLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
