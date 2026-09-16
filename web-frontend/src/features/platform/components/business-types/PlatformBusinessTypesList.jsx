import { Layers } from 'lucide-react';

export default function PlatformBusinessTypesList({ t, types, isLoading, activeTypeId, onSelect }) {
  return (
    <aside className="business-constructor__card">
      <div className="business-constructor__head">
        <Layers size={14} aria-hidden />
        {t('platform.businessTypes.typesList')}
      </div>
      <div className="business-constructor__list">
        {isLoading ? (
          <p className="business-constructor__empty">{t('common.loading')}</p>
        ) : types.length === 0 ? (
          <p className="business-constructor__empty">{t('platform.businessTypes.selectType')}</p>
        ) : (
          types.map((type) => (
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
