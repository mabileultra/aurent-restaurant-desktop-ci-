import { useMemo, useState } from 'react';
import { classifyCalendarItem } from './billingCalendarUtils';

export function useBillingCalendarFilter({ rawDays = [], companyMap = {}, todayIso }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    planFilter !== 'ALL' ||
    regionFilter !== 'ALL' ||
    Boolean(search.trim());

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setPlanFilter('ALL');
    setRegionFilter('ALL');
    setSearch('');
  };

  const filteredDays = useMemo(() => {
    if (!hasActiveFilters) {
      return rawDays;
    }

    const qSearch = search.toLowerCase().trim();

    return rawDays.map((day) => {
      const dayIso = day.date || day.iso;
      const isFuture = Boolean(dayIso && todayIso && dayIso > todayIso);

      const filteredItems = (day.items || []).filter((item) => {
        const company = companyMap[item.companyId];
        const b = company?.billing;

        if (statusFilter !== 'ALL') {
          const category = classifyCalendarItem(item, company, isFuture);
          if (category !== statusFilter) return false;
        }

        if (planFilter !== 'ALL') {
          const compPlanId = String(b?.planId || '');
          if (compPlanId !== planFilter) return false;
        }

        if (regionFilter !== 'ALL') {
          const compRegion = company?.regionCode || b?.regionCode;
          if (compRegion !== regionFilter) return false;
        }

        if (qSearch) {
          const name = (item.companyName || b?.companyName || '').toLowerCase();
          const id = String(item.companyId || '');
          const tin = String(company?.companyTin || '');
          const phone = String(company?.companyPhone || '');
          if (
            !name.includes(qSearch) &&
            !id.includes(qSearch) &&
            !tin.includes(qSearch) &&
            !phone.includes(qSearch)
          ) {
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
  }, [rawDays, hasActiveFilters, statusFilter, planFilter, regionFilter, search, companyMap, todayIso]);

  return {
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    regionFilter,
    setRegionFilter,
    search,
    setSearch,
    hasActiveFilters,
    handleResetFilters,
    filteredDays,
  };
}
