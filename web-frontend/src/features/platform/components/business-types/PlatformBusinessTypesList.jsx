import { useMemo, useState } from 'react';
import { Layers, Search } from 'lucide-react';
import '../../../styles/platform/platform-filter-bar.css';

export default function PlatformBusinessTypesList({ t, types, isLoading, activeTypeId, onSelect }) {
  const [search, setSearch] = useState('');
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return types;
    return types.filter((type) => [type.name, type.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }, [types, search]);

  return (
    <aside className="business-constructor__card">
      <div className="business-constructor__head">
        <Layers size={14} aria-hidden />
        {t('platform.businessTypes.typesList')}
      </div>
      <label className="platform-filter-bar__search business-constructor__search">
        <Search size={15} strokeWidth={2.2} aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('platform.businessTypes.search', { defaultValue: 'Поиск типа…' })}
          aria-label={t('platform.businessTypes.search', { defaultValue: 'Поиск типа…' })}
        />
      </label>
      <div className="business-constructor__list">
        {isLoading ? (
          <p className="business-constructor__empty">{t('common.loading')}</p>
        ) : visible.length === 0 ? (
          <p className="business-constructor__empty">{t('platform.businessTypes.selectType')}</p>
        ) : (
          visible.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`business-constructor__item${activeTypeId === type.id ? ' is-active' : ''}`}
            >
              <span className="business-constructor__item-icon" aria-hidden>
                <Layers size={14} />
              </span>
              <span>
                <span className="business-constructor__item-name">{type.name}</span>
                <span className="business-constructor__item-meta">
                  {type.code}
                  {' · '}
                  {type.fieldsCount}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
