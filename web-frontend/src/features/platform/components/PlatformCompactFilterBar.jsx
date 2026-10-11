import { RotateCcw, Search } from 'lucide-react';
import PlatformFilterMenu from './PlatformFilterMenu';
import '../../../styles/platform/platform-filter-bar.css';

export default function PlatformCompactFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filterOptions,
  filterValue = '',
  onFilterChange,
  filterLabel,
  extra,
  onReset,
  resetLabel,
  className,
}) {
  return (
    <div className={className ? `platform-filter-bar ${className}` : 'platform-filter-bar'}>
      <label className="platform-filter-bar__search">
        <Search size={16} strokeWidth={2.2} aria-hidden />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      <PlatformFilterMenu
        options={filterOptions}
        value={filterValue}
        onChange={onFilterChange}
        label={filterLabel}
      />
      {extra ? <div className="platform-filter-bar__extra">{extra}</div> : null}
      {onReset ? (
        <button type="button" className="platform-filter-bar__reset" aria-label={resetLabel || 'Reset'} onClick={onReset}>
          <RotateCcw size={15} strokeWidth={2.2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
