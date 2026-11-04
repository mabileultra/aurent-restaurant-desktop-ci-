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

export default function BillingCalendarView({ t, money, p, onOpenCompany }) {
  const { i18n } = useTranslation();
  const lang = i18n?.language || 'uz';
  const currency = t('billing.currency');
  const sum = (v) => `${money(v)} ${currency}`;

  const todayIso = new Date().toLocaleDateString('sv-SE');
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [picked, setPicked] = useState(todayIso);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [listDayFilter, setListDayFilter] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const hasActiveFilters = statusFilter !== 'ALL' || planFilter !== 'ALL' || regionFilter !== 'ALL' || Boolean(search.trim());

  // Handle day selection with month synchronization
  const handleSelectDay = (iso) => {
    if (!iso) return;
    setPicked(iso);
    const targetMonth = monthKey(iso);
    if (targetMonth && targetMonth !== month) {
      setMonth(targetMonth);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setPlanFilter('ALL');
    setRegionFilter('ALL');
    setSearch('');
  };

  // 1. Fetch Calendar Projection for Month
  const q = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'calendar', month],
    queryFn: () => platformBillingApi.collectionsCalendar({ month }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  // 2. Fetch all companies for metadata enrichment (balance, plan, region, phone)
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

  // 3. Filtered Days and Items based on toolbar filters
  const filteredDays = useMemo(() => {
    if (!hasActiveFilters) {
      return rawDays;
    }

    const qSearch = search.toLowerCase().trim();

    return rawDays.map((day) => {
      const filteredItems = (day.items || []).filter((item) => {
        const company = companyMap[item.companyId];
        const b = company?.billing;
        const balance = Number(b?.balance ?? 0);
        const amt = Number(item.amount ?? 0);
        const isOverdue = item.paymentState === 'OVERDUE' || balance < 0;
        const hasDeferral = Boolean(b?.deferralUntil);
        const isLowBalance = isOverdue || (balance < amt && item.paymentState !== 'ACTIVE');

        // Status filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'ACTIVE' && item.paymentState !== 'ACTIVE') return false;
          if (statusFilter === 'PLANNED' && (item.paymentState === 'ACTIVE' || isLowBalance || hasDeferral || item.paymentState === 'SUSPENDED')) return false;
          if (statusFilter === 'DEFERRAL' && !hasDeferral) return false;
          if (statusFilter === 'LOW_BALANCE' && !isLowBalance) return false;
          if (statusFilter === 'SUSPENDED' && item.paymentState !== 'SUSPENDED') return false;
        }

        // Plan filter
        if (planFilter !== 'ALL') {
          const compPlanId = String(b?.planId || '');
          if (compPlanId !== planFilter) return false;
        }

        // Region filter
        if (regionFilter !== 'ALL') {
          const compRegion = company?.regionCode || b?.regionCode;
          if (compRegion !== regionFilter) return false;
        }

        // Search query
        if (qSearch) {
          const name = (item.companyName || b?.companyName || '').toLowerCase();
          const id = String(item.companyId || '');
          const tin = String(company?.companyTin || '');
          const phone = String(company?.companyPhone || '');
          if (!name.includes(qSearch) && !id.includes(qSearch) && !tin.includes(qSearch) && !phone.includes(qSearch)) {
            return false;
          }
        }

        return true;
      });

      return {
        ...day,
        count: filteredItems.length,
        items: filteredItems,
      };
    });
  }, [rawDays, hasActiveFilters, statusFilter, planFilter, regionFilter, search, companyMap]);

  // 4. Compute Monthly KPIs (scoped to filtered view when filters active)
  const kpis = useMemo(() => {
    return computeCalendarKpis(
      filteredDays,
      hasActiveFilters ? 0 : Number(q.data?.totalAmount || 0),
      hasActiveFilters ? 0 : Number(q.data?.totalCount || 0),
      companyMap,
    );
  }, [filteredDays, hasActiveFilters, q.data?.totalAmount, q.data?.totalCount, companyMap]);

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
    if (companyRow && p?.selectCompany) {
      p.selectCompany(companyRow);
    } else if (p?.openCompanyById) {
      p.openCompanyById(companyId);
    } else if (onOpenCompany) {
      onOpenCompany(companyId);
    }
  };

  const handleOpenPaymentModal = (companyId) => {
    p?.openPaymentModal?.(companyId, { returnToDrawer: false });
  };

  return (
    <div className="bc-calendar-dashboard">
      {/* 1. Top 5 Executive KPI Cards */}
      <BillingCalendarKpis t={t} kpis={kpis} sum={sum} />

      {/* 2. Calendar Toolbar & Filters Bar */}
      <BillingCalendarToolbar
        t={t}
        month={month}
        setMonth={setMonth}
        onToday={handleToday}
        viewMode={viewMode}
        setViewMode={(mode) => {
          if (mode === 'list') {
            setListDayFilter(null);
          }
          setViewMode(mode);
        }}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        planFilter={planFilter}
        setPlanFilter={setPlanFilter}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
        search={search}
        setSearch={setSearch}
        hasFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        plans={p?.plans || []}
        lang={lang}
      />

      {/* 3. Main Body: Calendar or List View */}
      {viewMode === 'calendar' ? (
        <div className="bc-cal-main-layout">
          {/* Calendar Grid with 7 Columns & Legend */}
          <BillingCalendarGrid
            t={t}
            month={month}
            setMonth={setMonth}
            picked={picked}
            setPicked={handleSelectDay}
            byDate={byDate}
            companyMap={companyMap}
            money={money}
            lang={lang}
          />

          {/* Right Side: Daily Details Panel */}
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
