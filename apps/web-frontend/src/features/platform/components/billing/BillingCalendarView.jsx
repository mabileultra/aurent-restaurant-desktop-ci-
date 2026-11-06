import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { platformBillingApi } from '../../../../api';
import { COLLECTIONS_QUERY_KEY } from '../../hooks/useBillingCollections';
import {
  BILLING_COLLECTIONS_ENRICH_SIZE,
  unwrapBillingCollectionsPage,
} from '../../utils/unwrapBillingCollectionsPage';
import BillingCalendarKpis from './BillingCalendarKpis';
import BillingCalendarToolbar from './BillingCalendarToolbar';
import BillingCalendarGrid from './BillingCalendarGrid';
import BillingCalendarDailyPanel from './BillingCalendarDailyPanel';
import BillingCalendarListView from './BillingCalendarListView';
import { computeCalendarKpis, monthKey } from './billingCalendarUtils';
import { useBillingCalendarFilter } from './useBillingCalendarFilter';

export default function BillingCalendarView({ t, money, p, onOpenCompany }) {
  const { i18n } = useTranslation();
  const lang = i18n?.language || 'uz';
  const currency = t('billing.currency');
  const sum = (v) => `${money(v)} ${currency}`;

  const todayIso = new Date().toLocaleDateString('sv-SE');
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [picked, setPicked] = useState(todayIso);
  const [viewMode, setViewMode] = useState('calendar');
  const [listDayFilter, setListDayFilter] = useState(null);

  const handleMonthChange = (newMonth) => {
    if (!newMonth) return;
    setMonth(newMonth);
    setListDayFilter(null);
    const thisMonthKey = monthKey(new Date());
    setPicked(newMonth === thisMonthKey ? todayIso : `${newMonth}-01`);
  };

  const handleSelectDay = (iso) => {
    if (!iso) return;
    setPicked(iso);
    const targetMonth = monthKey(iso);
    if (targetMonth && targetMonth !== month) setMonth(targetMonth);
  };

  const q = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'calendar', month],
    queryFn: () => platformBillingApi.collectionsCalendar({ month }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const companiesQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', 'calendar-enrichment'],
    queryFn: () => platformBillingApi
      .collectionsCompanies({ page: 0, size: BILLING_COLLECTIONS_ENRICH_SIZE })
      .then((r) => unwrapBillingCollectionsPage(r.data).content),
    staleTime: 60_000,
  });

  const companyMap = useMemo(() => {
    const map = {};
    const list = companiesQ.data || [];
    for (const c of list) {
      if (c?.billing?.companyId != null) {
        map[c.billing.companyId] = c;
      }
    }
    return map;
  }, [companiesQ.data]);

  const rawDays = q.data?.days || [];

  const filter = useBillingCalendarFilter({
    rawDays,
    companyMap,
    todayIso,
  });

  const { filteredDays, hasActiveFilters } = filter;

  const kpis = useMemo(() => {
    return computeCalendarKpis(
      filteredDays,
      hasActiveFilters ? 0 : Number(q.data?.totalAmount || 0),
      hasActiveFilters ? 0 : Number(q.data?.totalCount || 0),
      companyMap,
      todayIso,
    );
  }, [filteredDays, hasActiveFilters, q.data?.totalAmount, q.data?.totalCount, companyMap, todayIso]);

  const byDate = useMemo(
    () => Object.fromEntries(filteredDays.map((d) => [d.date, d])),
    [filteredDays],
  );

  const pickedDayData = byDate[picked] || { date: picked, items: [] };

  const handleToday = () => {
    setMonth(monthKey(new Date()));
    setPicked(todayIso);
  };

  const handleOpenCompany = (companyId, companyRow) => {
    if (companyRow && p?.selectCompany) p.selectCompany(companyRow);
    else if (p?.openCompanyById) p.openCompanyById(companyId);
    else if (onOpenCompany) onOpenCompany(companyId);
  };

  const handleOpenPaymentModal = (companyId) => {
    p?.openPaymentModal?.(companyId, { returnToDrawer: false });
  };

  return (
    <div className="bc-calendar-dashboard">
      <BillingCalendarKpis t={t} kpis={kpis} sum={sum} />

      <BillingCalendarToolbar
        t={t}
        month={month}
        setMonth={handleMonthChange}
        onToday={handleToday}
        viewMode={viewMode}
        setViewMode={(mode) => {
          if (mode === 'list') setListDayFilter(null);
          setViewMode(mode);
        }}
        statusFilter={filter.statusFilter}
        setStatusFilter={filter.setStatusFilter}
        planFilter={filter.planFilter}
        setPlanFilter={filter.setPlanFilter}
        regionFilter={filter.regionFilter}
        setRegionFilter={filter.setRegionFilter}
        search={filter.search}
        setSearch={filter.setSearch}
        hasFilters={filter.hasActiveFilters}
        onResetFilters={filter.handleResetFilters}
        plans={p?.plans || []}
        lang={lang}
      />

      {viewMode === 'calendar' ? (
        <div className="bc-cal-main-layout">
          <BillingCalendarGrid
            t={t}
            month={month}
            setMonth={handleMonthChange}
            picked={picked}
            setPicked={handleSelectDay}
            byDate={byDate}
            companyMap={companyMap}
            money={money}
            lang={lang}
          />

          <BillingCalendarDailyPanel
            t={t}
            picked={picked}
            setPicked={handleSelectDay}
            dayData={pickedDayData}
            companyMap={companyMap}
            money={money}
            currency={currency}
            lang={lang}
            onOpenCompany={handleOpenCompany}
            onOpenPaymentModal={handleOpenPaymentModal}
            onSwitchToList={(dayIso) => {
              setListDayFilter(dayIso || picked);
              setViewMode('list');
            }}
          />
        </div>
      ) : (
        <BillingCalendarListView
          t={t}
          month={month}
          days={filteredDays}
          companyMap={companyMap}
          money={money}
          currency={currency}
          lang={lang}
          selectedDate={listDayFilter}
          onClearDateFilter={() => setListDayFilter(null)}
          onOpenCompany={handleOpenCompany}
          onOpenPaymentModal={handleOpenPaymentModal}
          p={p}
        />
      )}
    </div>
  );
}
