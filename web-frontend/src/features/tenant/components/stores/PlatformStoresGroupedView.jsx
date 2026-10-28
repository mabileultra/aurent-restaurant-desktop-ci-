import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  MapPin,
  Phone,
  Plus,
  Store,
} from 'lucide-react';
import { Spinner } from '../../../../components/ui';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
  getCompanyPalette,
} from '../../../platform/utils/companyAvatarUtils';
import { formatUzPhone } from '../../../../utils/phoneUz';
import { storeIsPharmacy } from '../../utils/storeAslMarkingSupport';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';

export default function PlatformStoresGroupedView({
  t,
  stores = [],
  companies = [],
  companyId = '',
  focusCompanyId = '',
  search = '',
  businessType = '',
  regionCode = '',
  districtCode = '',
  statusFilter = 'ALL',
  isPending = false,
  menuId = null,
  onMenuOpenChange,
  onEdit,
  onToggleActive,
  onDelete,
  onPharmacyIntegration,
  onSelectStore,
  openCreateForCompany,
}) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [hasUserToggled, setHasUserToggled] = useState(false);

  const targetFocusId = useMemo(() => {
    if (focusCompanyId != null && focusCompanyId !== '') {
      const parsed = Number(focusCompanyId);
      return Number.isNaN(parsed) ? focusCompanyId : parsed;
    }
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const spFocus = sp.get('focusCompany') || sp.get('company');
      if (spFocus) {
        const parsed = Number(spFocus);
        return Number.isNaN(parsed) ? spFocus : parsed;
      }
      if (window.location.hash?.startsWith('#company-')) {
        const hashVal = window.location.hash.replace('#company-', '');
        const parsed = Number(hashVal);
        return Number.isNaN(parsed) ? hashVal : parsed;
      }
    }
    return null;
  }, [focusCompanyId]);

  const [highlightedId, setHighlightedId] = useState(targetFocusId);

  const regionCodes = useMemo(
    () => stores.map((r) => r.regionCode).filter(Boolean),
    [stores]
  );
  const { regionName, districtName, empty } = useGeoNameLookup(regionCodes);

  const renderLocationText = (store) => {
    const reg = store.regionCode ? regionName(store.regionCode) : '';
    const dist = store.districtCode ? districtName(store.districtCode) : '';
    const isClean = (v) => v && v !== empty && v !== 'Yo‘q' && v !== "Yo'q" && v !== 'Нет';

    const geoParts = [isClean(reg) ? reg : '', isClean(dist) ? dist : ''].filter(Boolean);
    const geoLine = geoParts.join(', ');
    const addrLine = store.address?.trim() || '';

    if (!addrLine && !geoLine) {
      return <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>;
    }

    return (
      <div className="flex flex-col text-xs max-w-xs sm:max-w-sm truncate">
        {addrLine && (
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate" title={addrLine}>
            {addrLine}
          </span>
        )}
        {geoLine && (
          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5" title={geoLine}>
            <MapPin size={11} className="shrink-0 text-slate-400" />
            <span>{geoLine}</span>
          </span>
        )}
      </div>
    );
  };

  // 1. Filter stores by search, businessType, region, district, statusFilter, companyId
  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cIdNum = companyId ? Number(companyId) : null;
    return stores.filter((store) => {
      if (cIdNum && Number(store.companyId) !== cIdNum) return false;
      if (statusFilter === 'ACTIVE' && !store.active) return false;
      if (statusFilter === 'INACTIVE' && store.active) return false;
      if (businessType && store.businessType !== businessType) return false;
      if (regionCode && store.regionCode !== regionCode) return false;
      if (districtCode && store.districtCode !== districtCode) return false;

      if (q) {
        const matchName = store.name?.toLowerCase().includes(q);
        const matchCode = store.code?.toLowerCase().includes(q);
        const matchAddr = store.address?.toLowerCase().includes(q);
        const matchComp = store.companyName?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAddr && !matchComp) return false;
      }
      return true;
    });
  }, [stores, companyId, search, businessType, regionCode, districtCode, statusFilter]);

  // 2. Group filtered stores by company
  const companyGroups = useMemo(() => {
    const companyMap = new Map();
    const cIdNum = companyId ? Number(companyId) : null;

    // Seed with all companies if available so we have rich company metadata
    companies.forEach((comp) => {
      companyMap.set(Number(comp.id), {
        company: comp,
        stores: [],
      });
    });

    // Bucket filtered stores
    const orphanStores = [];
    filteredStores.forEach((store) => {
      const cId = store.companyId ? Number(store.companyId) : null;
      if (cId && companyMap.has(cId)) {
        companyMap.get(cId).stores.push(store);
      } else if (cId) {
        companyMap.set(cId, {
          company: { id: cId, name: store.companyName || `Kompaniya #${cId}` },
          stores: [store],
        });
      } else {
        orphanStores.push(store);
      }
    });

    // Build list: only include companies that either have stores, or when no search/filters active
    const groups = [];
    const hasFilters = Boolean(
      search || businessType || regionCode || districtCode || statusFilter !== 'ALL' || companyId
    );

    companyMap.forEach((entry, cId) => {
      // If companyId filter is active, only include that specific company
      if (cIdNum && cId !== cIdNum) return;

      if (entry.stores.length > 0 || !hasFilters || (cIdNum && cId === cIdNum)) {
        const total = entry.stores.length;
        const active = entry.stores.filter((s) => s.active).length;
        const inactive = total - active;
        groups.push({
          id: cId,
          company: entry.company,
          stores: entry.stores,
          total,
          active,
          inactive,
        });
      }
    });

    // Sort: companies with most branches first, then alphabetically
    groups.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return (a.company.name || '').localeCompare(b.company.name || '');
    });

    if (!cIdNum && orphanStores.length > 0) {
      groups.push({
        id: 'orphan',
        company: { id: 'orphan', name: t('platform.colCompanyGeneral', { defaultValue: 'Umumiy / Biriktirilmagan' }) },
        stores: orphanStores,
        total: orphanStores.length,
        active: orphanStores.filter((s) => s.active).length,
        inactive: orphanStores.filter((s) => !s.active).length,
      });
    }

    return groups;
  }, [filteredStores, companies, companyId, search, businessType, regionCode, districtCode, statusFilter, t]);

  // UX Rule: If user is actively searching or filtering, auto-expand matches!
  // If viewing whole directory (100+ companies), keep collapsed by default to avoid infinite scroll.
  const isActivelyFiltering = Boolean(
    search || businessType || regionCode || districtCode || statusFilter !== 'ALL' || companyId
  );

  const effectiveExpanded = useMemo(() => {
    if (hasUserToggled) return expandedIds;
    const autoSet = new Set();
    // Default open for the focused company
    if (targetFocusId != null) {
      autoSet.add(targetFocusId);
    }
    if (isActivelyFiltering || companyGroups.length <= 2) {
      companyGroups.forEach((g) => {
        if (g.stores.length > 0) autoSet.add(g.id);
      });
    }
    return autoSet;
  }, [hasUserToggled, expandedIds, companyGroups, isActivelyFiltering, targetFocusId]);

  // Auto-scroll and highlight targetFocusId
  useEffect(() => {
    if (targetFocusId == null) return;

    setHasUserToggled(false);
    setHighlightedId(targetFocusId);

    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`company-group-${targetFocusId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    const highlightTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 3500);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(highlightTimer);
    };
  }, [targetFocusId, companyGroups.length]);

  const toggleGroup = (id) => {
    setHasUserToggled(true);
    setExpandedIds((prev) => {
      const next = new Set(hasUserToggled ? prev : effectiveExpanded);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setHasUserToggled(true);
    const allSet = new Set(companyGroups.map((g) => g.id));
    setExpandedIds(allSet);
  };

  const collapseAll = () => {
    setHasUserToggled(true);
    setExpandedIds(new Set());
  };

  // Accurate check: are all companies with stores expanded?
  const allAreExpanded = companyGroups.length > 0 && companyGroups.every((g) => effectiveExpanded.has(g.id));

  if (isPending) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Spinner size="md" text={t('common.loading')} />
      </div>
    );
  }

  if (companyGroups.length === 0) {
    return (
      <div className="py-16 px-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          <Store size={26} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {t('platform.groupedEmptyTitle', { defaultValue: 'Filiallar topilmadi' })}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {t('platform.groupedEmptyDesc', { defaultValue: 'Tanlangan filtr yoki qidiruv so‘rovi bo‘yicha hech qanday filial mavjud emas.' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Group Toolbar: Section Title + Counter + Prominent Expand/Collapse Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {t('platform.companiesNetworkTitle', { defaultValue: 'Kompaniyalar tarmog‘i' })}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold text-xs border border-slate-200/80 dark:border-slate-700">
            {companyGroups.length} ta kompaniya • {filteredStores.length} ta filial
          </span>
        </div>

        <button
          type="button"
          onClick={allAreExpanded ? collapseAll : expandAll}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          {allAreExpanded ? (
            <>
              <ChevronsUp size={15} className="text-slate-500 dark:text-slate-400" />
              <span>{t('platform.groupedCollapseAll', { defaultValue: 'Barchasini yopish' })}</span>
            </>
          ) : (
            <>
              <ChevronsDown size={15} className="text-slate-500 dark:text-slate-400" />
              <span>{t('platform.groupedExpandAll', { defaultValue: 'Barchasini ochish' })}</span>
            </>
          )}
        </button>
      </div>

      {/* Accordion List by Company */}
      <div className="space-y-3">
        {companyGroups.map((group) => {
          const isExpanded = effectiveExpanded.has(group.id);
          const isHighlighted =
            highlightedId != null &&
            (group.id === highlightedId ||
              String(group.id) === String(highlightedId) ||
              Number(group.id) === Number(highlightedId));
          const initials = getCompanyInitials(group.company.name);
          const paletteClass = getCompanyPalette(group.company.name, group.company.id);

          return (
            <div
              key={group.id}
              id={`company-group-${group.id}`}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs scroll-mt-24 ${
                isHighlighted
                  ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/50 shadow-md bg-white dark:bg-slate-900'
                  : isExpanded
                  ? 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900 ring-1 ring-slate-900/5'
                  : 'border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Company Card Header (Distinct Header Band) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleGroup(group.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleGroup(group.id);
                  }
                }}
                className={`w-full p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left cursor-pointer select-none transition-colors ${
                  isExpanded
                    ? 'bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/50'
                }`}
                aria-expanded={isExpanded}
              >
                {/* Left: Avatar + Title + Business Type */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold font-mono text-sm shadow-2xs shrink-0 border ${paletteClass}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                        {group.company.name}
                      </h3>
                      {group.company.businessType && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {t(`productTemplates.businessTypes.${group.company.businessType}`, { defaultValue: group.company.businessType })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {group.company.tin && (
                        <span className="font-mono">STIR: {group.company.tin}</span>
                      )}
                      {group.company.phone && (
                        <span>• {formatUzPhone(group.company.phone)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badges + Action Buttons + Chevron */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                  {/* Branch Count Pills */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {t('platform.groupedBranchesCount', { count: group.total, defaultValue: `${group.total} ta filial` })}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      {t('platform.groupedActiveCount', { count: group.active, defaultValue: `${group.active} faol` })}
                    </span>
                    {group.inactive > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                        {t('platform.groupedInactiveCount', { count: group.inactive, defaultValue: `${group.inactive} nofaol` })}
                      </span>
                    )}
                  </div>

                  {/* Add Branch Button */}
                  {typeof group.id === 'number' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateForCompany?.(group.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                      title={t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}
                    >
                      <Plus size={14} />
                      <span className="hidden md:inline">{t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}</span>
                    </button>
                  )}

                  {/* Chevron Toggle */}
                  <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Sub-list of Branches (When Expanded) */}
              {isExpanded && (
                <div className="bg-white dark:bg-slate-900">
                  {group.stores.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      <p>{t('platform.groupedEmptyCompany', { defaultValue: 'Ushbu kompaniyada hozircha filiallar yo‘q' })}</p>
                      {typeof group.id === 'number' && (
                        <button
                          type="button"
                          onClick={() => openCreateForCompany?.(group.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <Plus size={13} />
                          <span>{t('platform.groupedAddBranch', { defaultValue: 'Birinchi filialni qo‘shish' })}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800/90 text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-850/40">
                            <th className="px-5 py-2.5 font-medium">{t('platform.colBranchName', { defaultValue: 'Filial nomi' })}</th>
                            <th className="px-4 py-2.5 font-medium">{t('platform.colBranchType', { defaultValue: 'Filial turi' })}</th>
                            <th className="px-4 py-2.5 font-medium">{t('stores.colAddress', { defaultValue: 'Manzil va joylashuv' })}</th>
                            <th className="px-4 py-2.5 font-medium">{t('stores.colPhone', { defaultValue: 'Telefon' })}</th>
                            <th className="px-4 py-2.5 font-medium">{t('stores.colActive', { defaultValue: 'Holat' })}</th>
                            <th className="px-4 py-2.5 w-12 text-right" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {group.stores.map((store) => {
                            const branchMeta = getCompanyBranchMeta(store.businessType, t);
                            const TypeIcon = branchMeta.icon;
                            const badgeClass = getBusinessTypeBadgeClass();

                            return (
                              <tr
                                key={store.id}
                                onClick={() => onSelectStore?.(store)}
                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                              >
                                {/* Name + Branch Icon */}
                                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/60 dark:group-hover:text-emerald-300 transition-colors">
                                      <TypeIcon size={13} />
                                    </div>
                                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs" title={store.name}>
                                      {store.name}
                                    </span>
                                  </div>
                                </td>

                                {/* Type Badge */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeClass}`}>
                                    <span>
                                      {t(`productTemplates.businessTypes.${store.businessType ?? 'UNIVERSAL'}`, {
                                        defaultValue: store.businessType || 'Universal',
                                      })}
                                    </span>
                                  </span>
                                </td>

                                {/* Address & Location (Unified, no empty dashes) */}
                                <td className="px-4 py-3">
                                  {renderLocationText(store)}
                                </td>

                                {/* Phone */}
                                <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  {store.phone ? (
                                    formatUzPhone(store.phone)
                                  ) : (
                                    <span className="text-slate-400 dark:text-slate-600 font-medium font-sans">—</span>
                                  )}
                                </td>

                                {/* Active Badge */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                      store.active
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    {store.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
                                  </span>
                                </td>

                                {/* Actions Menu */}
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <TableRowActionsMenu
                                    open={menuId === store.id}
                                    onOpenChange={(next) => onMenuOpenChange?.(next ? store.id : null)}
                                    actions={[
                                      { label: t('common.view', { defaultValue: 'Ko‘rish' }), onClick: () => onSelectStore?.(store) },
                                      { label: t('common.edit'), onClick: () => onEdit?.(store) },
                                      ...(storeIsPharmacy(store.businessType) && onPharmacyIntegration
                                        ? [{
                                          label: t('stores.pharmacyIntegration.menu'),
                                          onClick: () => onPharmacyIntegration(store),
                                        }]
                                        : []),
                                      {
                                        label: store.active ? t('stores.deactivate') : t('stores.activate'),
                                        onClick: () => onToggleActive?.(store.id),
                                      },
                                      {
                                        label: t('common.delete'),
                                        danger: true,
                                        onClick: () => onDelete?.(store),
                                      },
                                    ]}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
