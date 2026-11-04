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
            className="admin-btn-secondary px-4 py-2 text-sm"
          >
            <Plus size={16} />
            {addLabel}
          </button>
        ) : null}
        {showFilter ? (
          <button
            type="button"
            onClick={onOpenFilters}
            className="admin-btn-primary px-4 py-2 text-sm"
          >
            <Filter size={16} />
            {filterLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
