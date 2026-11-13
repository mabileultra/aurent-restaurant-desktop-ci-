import React from 'react';
import { AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';

export default function PlatformCompaniesTableHeader({ t }) {
  return (
    <thead>
      <tr className="border-b border-aa-line bg-aa-surface-sunken text-left text-xs font-semibold text-aa-ink-muted">
        <AdminTableNoIdHeaders />
        <th className="px-3 py-2.5 font-semibold min-w-[220px]">
          {t('platform.colCompany', { defaultValue: 'Kompaniya' })}
        </th>
        <th className="px-3 py-2.5 font-semibold min-w-[160px]">
          {t('platform.colLocation', { defaultValue: 'Manzil' })}
        </th>
        <th className="px-3 py-2.5 font-semibold">{t('platform.colLoginCode')}</th>
        <th className="px-3 py-2.5 font-semibold">{t('platform.colBranches', { defaultValue: 'Filiallar' })}</th>
        <th className="px-3 py-2.5 font-semibold">{t('platform.colBusinessType')}</th>
        <th className="px-3 py-2.5 font-semibold">{t('common.status')}</th>
        <th className="w-12 px-3 py-2.5" />
      </tr>
    </thead>
  );
}
