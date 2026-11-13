import React from 'react';
import { Building2, CheckCircle2 as CircleCheck, PauseCircle as CirclePause, Store } from 'lucide-react';
import KpiCard from '../../../components/aa/KpiCard';

/**
 * PlatformCompanyStatsCards — Kompaniyalar bo‘limining 4 ta KPI ko‘rsatkich kartasi.
 * aa KpiCard komponentidan foydalanadi.
 */
export default function PlatformCompanyStatsCards({
  t,
  totalCompanies = 0,
  activeCompanies = 0,
  inactiveCompanies = 0,
  totalStores = 0,
  isPending = false,
  isError = false,
}) {
  const pct = totalCompanies > 0 ? (activeCompanies / totalCompanies) * 100 : 0;
  const pctFormatted = pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1).replace('.', ',')}%`;

  const formatValue = (val) => {
    if (isPending) return undefined;
    if (isError || val == null) return '—';
    return Number(val).toLocaleString('uz-UZ');
  };

  return (
    <div className="grid grid-cols-1 aa-desktop:grid-cols-2 aa-wide:grid-cols-4 gap-4">
      {/* 1. Jami kompaniyalar */}
      <KpiCard
        label={(
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={16} className="text-aa-ink-muted" aria-hidden="true" />
            <span>{t ? t('platform.statsAll', { defaultValue: 'Jami kompaniyalar' }) : 'Jami kompaniyalar'}</span>
          </span>
        )}
        value={formatValue(totalCompanies)}
        meta={t ? t('platform.statsAllDesc', { defaultValue: 'Platformaga ulangan' }) : 'Platformaga ulangan'}
        loading={isPending}
      />

      {/* 2. Faol kompaniyalar */}
      <KpiCard
        label={(
          <span className="inline-flex items-center gap-1.5">
            <CircleCheck size={16} className="text-aa-ink-muted" aria-hidden="true" />
            <span>{t ? t('platform.statsActive', { defaultValue: 'Faol kompaniyalar' }) : 'Faol kompaniyalar'}</span>
          </span>
        )}
        value={formatValue(activeCompanies)}
        split={totalCompanies > 0 && !isPending && !isError ? [{ value: pct, tone: 'success' }] : undefined}
        meta={!isPending && !isError ? `${pctFormatted} faoliyatda` : undefined}
        loading={isPending}
      />

      {/* 3. Ulangan filiallar */}
      <KpiCard
        label={(
          <span className="inline-flex items-center gap-1.5">
            <Store size={16} className="text-aa-ink-muted" aria-hidden="true" />
            <span>{t ? t('platform.statsStores', { defaultValue: 'Ulangan filiallar' }) : 'Ulangan filiallar'}</span>
          </span>
        )}
        value={formatValue(totalStores)}
        meta={t ? t('platform.statsStoresDesc', { defaultValue: 'Barcha savdo va xizmat nuqtalari' }) : 'Barcha savdo va xizmat nuqtalari'}
        loading={isPending}
      />

      {/* 4. Nofaol kompaniyalar */}
      <KpiCard
        label={(
          <span className="inline-flex items-center gap-1.5">
            <CirclePause size={16} className="text-aa-ink-muted" aria-hidden="true" />
            <span>{t ? t('platform.companiesInactiveLabel', { defaultValue: 'Nofaol kompaniyalar' }) : 'Nofaol kompaniyalar'}</span>
          </span>
        )}
        value={formatValue(inactiveCompanies)}
        meta={t ? t('platform.companiesInactiveDesc', { defaultValue: 'Faolsizlantirilgan, kassalari to‘xtatilgan' }) : 'Faolsizlantirilgan, kassalari to‘xtatilgan'}
        loading={isPending}
      />
    </div>
  );
}
