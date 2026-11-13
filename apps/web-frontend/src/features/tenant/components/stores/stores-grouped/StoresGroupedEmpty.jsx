import React from 'react';
import { Store } from 'lucide-react';

export default function StoresGroupedEmpty({ t }) {
  return (
    <div className="py-16 px-4 text-center rounded-aa-lg border border-aa-line bg-aa-surface shadow-none">
      <div className="w-14 h-14 mx-auto rounded-full bg-aa-surface-sunken border border-aa-line flex items-center justify-center text-aa-ink-muted mb-3">
        <Store size={26} />
      </div>
      <h3 className="text-base font-semibold text-aa-ink">
        {t('platform.groupedEmptyTitle', { defaultValue: 'Filiallar topilmadi' })}
      </h3>
      <p className="mt-1 text-sm text-aa-ink-muted max-w-md mx-auto">
        {t('platform.groupedEmptyDesc', {
          defaultValue: 'Tanlangan filtr yoki qidiruv so‘rovi bo‘yicha hech qanday filial mavjud emas.',
        })}
      </p>
    </div>
  );
}
