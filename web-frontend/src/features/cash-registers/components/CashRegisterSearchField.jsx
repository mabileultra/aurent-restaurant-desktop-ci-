import { Filter } from 'lucide-react';
import PageSearchField from '../../../components/ui/PageSearchField';

export default function CashRegisterSearchField({
  value,
  onChange,
  placeholder,
  filterLabel,
  onOpenFilters,
  showFilter = true,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <PageSearchField
        value={value}
        onChange={(next) => onChange({ target: { value: next } })}
        placeholder={placeholder}
      />
      {showFilter ? (
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600"
        >
          <Filter size={16} />
          {filterLabel}
        </button>
      ) : null}
    </div>
  );
}
