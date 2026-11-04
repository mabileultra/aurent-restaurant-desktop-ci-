import { useEffect, useRef, useState } from 'react';
import { Filter, Plus, RefreshCw, Search } from 'lucide-react';

export default function PharmacyListToolbar({
  t,
  createLabel,
  onCreate,
  onImport,
  onRefresh,
  search,
  onSearchChange,
  searchPlaceholder,
  filterOptions,
  filterValue,
  onFilterChange,
}) {
  const inputRef = useRef(null);
  const filterRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterActive = Boolean(filterValue);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'F2') return;
      if (e.target?.closest?.('[role="dialog"]')) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const onDoc = (e) => {
      if (!filterRef.current?.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  return (
    <div className="pharmacy-stock__toolbar">
      {onCreate ? (
        <button type="button" className="pharmacy-stock__tb-btn pharmacy-stock__tb-btn--create" onClick={onCreate}>
          <span>{createLabel || t('pharmacyStock.toolbarCreate')}</span>
          <Plus size={16} strokeWidth={2.4} />
        </button>
      ) : null}

      {onImport ? (
        <button type="button" className="pharmacy-stock__tb-btn pharmacy-stock__tb-btn--import" onClick={onImport}>
          <span>{t('pharmacyStock.import')}</span>
        </button>
      ) : null}

      {onRefresh ? (
        <button type="button" className="pharmacy-stock__tb-btn pharmacy-stock__tb-btn--refresh" onClick={onRefresh}>
          <span>{t('pharmacyStock.toolbarRefresh')}</span>
          <RefreshCw size={15} strokeWidth={2.3} />
        </button>
      ) : null}

      {filterOptions?.length ? (
        <div className="pharmacy-stock__tb-filter" ref={filterRef}>
          <span className="pharmacy-stock__tb-divider" aria-hidden />
          <button
            type="button"
            className={`pharmacy-stock__tb-btn pharmacy-stock__tb-btn--filter${filterActive ? ' is-active' : ''}`}
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
          >
            <span>{t('pharmacyStock.toolbarFilter')}</span>
            <span className="pharmacy-stock__tb-filter-icon">
              <Filter size={15} strokeWidth={2.2} />
              {filterActive ? <span className="pharmacy-stock__tb-dot" /> : null}
            </span>
          </button>
          {filterOpen ? (
            <div className="pharmacy-stock__tb-menu" role="menu">
              {filterOptions.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  role="menuitem"
                  className={`pharmacy-stock__tb-menu-item${filterValue === option.value ? ' is-active' : ''}`}
                  onClick={() => {
                    onFilterChange(option.value);
                    setFilterOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="pharmacy-stock__tb-search">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder || t('pharmacyStock.toolbarSearch')}
        />
        <Search size={16} strokeWidth={2.2} aria-hidden />
      </label>
    </div>
  );
}
