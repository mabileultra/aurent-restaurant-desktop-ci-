import React from 'react';
import { Power } from 'lucide-react';

export default function CompanyStatusToggle({ t, active, onToggle }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-aa-md border border-aa-line bg-aa-surface-sunken mb-3">
      <div>
        <div className="text-xs font-semibold text-aa-ink">
          {t('common.status')}: {active ? t('common.active') : t('common.inactive')}
        </div>
        <div className="text-xs text-aa-ink-muted">
          {active ? 'Kompaniya faol, savdo do‘konlari ishlaydi' : 'Kompaniya faolsizlantirilgan (nofaol)'}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-aa-md text-xs font-semibold border transition cursor-pointer ${
          active
            ? 'border-aa-brand/40 bg-aa-brand-soft text-aa-brand'
            : 'border-aa-line bg-aa-surface text-aa-ink-muted'
        }`}
      >
        <Power size={13} />
        <span>{active ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('platform.activate', { defaultValue: 'Faollashtirish' })}</span>
      </button>
    </div>
  );
}
