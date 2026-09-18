import { Search } from 'lucide-react';
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
  className,
}) {
  return (
    <div className={className ? `platform-filter-bar ${className}` : 'platform-filter-bar'}>
      <PlatformFilterMenu
        options={filterOptions}
        value={filterValue}
        onChange={onFilterChange}
        label={filterLabel}
      />
      <label className="platform-filter-bar__search">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
        <Search size={16} strokeWidth={2.2} aria-hidden />
      </label>
      {extra ? <div className="platform-filter-bar__extra">{extra}</div> : null}
    </div>
  );
}
