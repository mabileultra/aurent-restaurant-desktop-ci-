import { Layers } from 'lucide-react';

export default function PlatformBusinessTypesList({ t, types, isLoading, activeTypeId, onSelect }) {
  return (
    <div className="admin-card">
      <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
        {t('platform.businessTypes.typesList')}
      </div>
      <div className="max-h-[520px] overflow-y-auto p-2">
        {isLoading ? (
          <p className="px-2 py-4 text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          types.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                activeTypeId === type.id
                  ? 'admin-nav-link--active'
                  : 'text-slate-700 hover:bg-[color:var(--color-brand-soft)] dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Layers size={16} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-medium">{type.name}</span>
                <span className={`text-xs ${activeTypeId === type.id ? 'opacity-80' : 'text-slate-500'}`}>
                  {type.code} · {type.fieldsCount}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
