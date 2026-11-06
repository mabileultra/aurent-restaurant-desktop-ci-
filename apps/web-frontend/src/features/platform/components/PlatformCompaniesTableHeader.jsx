import React from 'react';
import { AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';

export default function PlatformCompaniesTableHeader({ t }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
        <AdminTableNoIdHeaders />
        <th className="px-4 py-3 font-medium min-w-[220px]">
          {t('platform.colCompany', { defaultValue: 'Kompaniya' })}
        </th>
        <th className="px-4 py-3 font-medium min-w-[160px]">
          {t('platform.colLocation', { defaultValue: 'Manzil' })}
        </th>
        <th className="px-4 py-3 font-medium">{t('platform.colLoginCode')}</th>
        <th className="px-4 py-3 font-medium">{t('platform.colBranches', { defaultValue: 'Filiallar' })}</th>
        <th className="px-4 py-3 font-medium">{t('platform.colBusinessType')}</th>
        <th className="px-4 py-3 font-medium">{t('common.status')}</th>
        <th className="w-12 px-4 py-3" />
      </tr>
    </thead>
  );
}
