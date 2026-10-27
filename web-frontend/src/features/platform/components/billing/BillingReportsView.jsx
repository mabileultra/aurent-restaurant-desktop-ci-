import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformBillingApi } from '../../../../api';
import { COLLECTIONS_QUERY_KEY } from '../../hooks/useBillingCollections';
import BillingReportsKpis from './BillingReportsKpis';
import BillingRevenueChart from './BillingRevenueChart';
import BillingMethodsBreakdown from './BillingMethodsBreakdown';
import BillingActionableLedger from './BillingActionableLedger';

export default function BillingReportsView({ t, money, p }) {
  const [period, setPeriod] = useState('MONTH');
  const currency = t('billing.currency');
  const sum = (v) => `${money(v)} ${currency}`;

  const q = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'reports', period],
    queryFn: () => platformBillingApi.collectionsReports({ period }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
  const r = q.data;

  if (q.isLoading) return <p className="bc-muted">{t('common.loading')}</p>;
  if (!r) return <p className="bc-muted">{t('platform.billing.actionFailed')}</p>;

  return (
    <div className="bc-reports-dashboard">
      {/* 1. 4 ta asosiy KPI Metric Cards */}
      <BillingReportsKpis t={t} r={r} sum={sum} period={period} />

      {/* 2. O'rta qator: Dinamika grafigi va To'lov usullari taqsimoti */}
      <div className="bc-reports-middle-grid">
        <BillingRevenueChart
          t={t}
          revenue={r.revenue}
          expected={r.expected}
          money={money}
          currency={currency}
        />
        <BillingMethodsBreakdown
          t={t}
          methods={r.methods || []}
          period={period}
          onPeriodChange={setPeriod}
          sum={sum}
        />
      </div>

      {/* 3. Pastki qavat: Yaqin to'lovlar va qarzdorlar jadvali (Actionable Ledger) */}
      <BillingActionableLedger t={t} money={money} p={p} />
    </div>
  );
}
