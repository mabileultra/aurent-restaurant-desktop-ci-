import React from 'react';
import { Store } from 'lucide-react';
import { EmptyState } from '../../../../../components/ui';

export default function StoresGroupedEmpty({ t }) {
  return (
    <div className="ui-card">
      <EmptyState
        icon={Store}
        title={t('platform.groupedEmptyTitle', { defaultValue: 'Filiallar topilmadi' })}
        description={t('platform.groupedEmptyDesc', {
          defaultValue: 'Tanlangan filtr yoki qidiruv so‘rovi bo‘yicha hech qanday filial mavjud emas.',
        })}
      />
    </div>
  );
}
