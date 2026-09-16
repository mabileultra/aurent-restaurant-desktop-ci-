import { PageSearchField } from '../../../components/ui';
import '../../../styles/platform/platform-filter-bar.css';

/**
 * Компактная строка суперадмина: узкий поиск и фильтры в одном ряду, как в аптеке.
 */
export default function PlatformCompactFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  extra,
  className,
}) {
  return (
    <div className={className ? `platform-filter-bar ${className}` : 'platform-filter-bar'}>
      <PageSearchField
        className="platform-filter-bar__search"
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />
      {filters ? <div className="platform-filter-bar__filters">{filters}</div> : null}
      {extra ? <div className="platform-filter-bar__extra">{extra}</div> : null}
    </div>
  );
}
