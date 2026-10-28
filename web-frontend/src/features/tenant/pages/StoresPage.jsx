import React from 'react';
import { Layers, List, Plus } from 'lucide-react';
import { BaseButton, PageLayout, PlatformErrorState } from '../../../components/ui';
import StoreFormModal from '../components/stores/StoreFormModal';
import PharmacyIntegrationSettingsModal from '../components/stores/PharmacyIntegrationSettingsModal';
import StoresFiltersBar from '../components/stores/StoresFiltersBar';
import StoresTable from '../components/stores/StoresTable';
import PlatformStoreStatsCards from '../components/stores/PlatformStoreStatsCards';
import PlatformStoreQuickDrawer from '../components/stores/PlatformStoreQuickDrawer';
import PlatformStoresGroupedView from '../components/stores/PlatformStoresGroupedView';
import { useStoresPage } from '../hooks/useStoresPage';

export default function StoresPage({
  title,
  showCompanySelect = false,
  companyIdFilter,
  companies = [],
}) {
  const p = useStoresPage({ showCompanySelect, companyIdFilter, companies });

  return (
    <PageLayout
      title={title || (showCompanySelect ? p.t('platform.storesTitle', { defaultValue: 'Filiallar' }) : p.t('stores.title'))}
      actions={(
        <BaseButton variant="secondary" onClick={() => p.openCreate()}>
          <Plus size={16} />
          {showCompanySelect ? p.t('platform.addBranch', { defaultValue: 'Filial qo‘shish' }) : p.t('stores.add')}
        </BaseButton>
      )}
    >
      <div className="space-y-4">
        {/* 1. KPI Stats Cards (in platform view) */}
        {showCompanySelect && (
          <PlatformStoreStatsCards
            t={p.t}
            totalStores={p.totalStores}
            activeStores={p.activeStores}
            inactiveStores={p.inactiveStores}
            companiesCount={p.companiesCount}
            statusFilter={p.statusFilter}
            onStatusFilterChange={p.setStatusFilter}
            isPending={p.isPending}
          />
        )}

        {/* 2. Status Segmented Tabs + View Switcher + Filters Bar */}
        <div className="space-y-3">
          {showCompanySelect && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Segmented Status Tabs */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => p.setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    p.statusFilter === 'ALL'
                      ? 'bg-white dark:!bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.t('platform.tabAll', { defaultValue: 'Barchasi' })}
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {p.totalStores}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => p.setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    p.statusFilter === 'ACTIVE'
                      ? 'bg-white dark:!bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  {p.t('platform.tabActive', { defaultValue: 'Faol' })}
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                    {p.activeStores}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => p.setStatusFilter('INACTIVE')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    p.statusFilter === 'INACTIVE'
                      ? p.inactiveStores > 0
                        ? 'bg-white dark:!bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                        : 'bg-white dark:!bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : p.inactiveStores > 0
                        ? 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.t('platform.tabInactive', { defaultValue: 'Nofaol' })}
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      p.inactiveStores > 0
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p.inactiveStores}
                  </span>
                </button>
              </div>

              {/* View Switcher: Grouped by Company vs Flat Table */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => p.setViewMode('grouped')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    p.viewMode === 'grouped'
                      ? 'bg-white dark:!bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={p.t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}
                >
                  <Layers size={14} />
                  <span>{p.t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}</span>
                </button>
                <button
                  type="button"
                  onClick={() => p.setViewMode('table')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    p.viewMode === 'table'
                      ? 'bg-white dark:!bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={p.t('platform.viewTable', { defaultValue: 'Yagona jadval' })}
                >
                  <List size={14} />
                  <span>{p.t('platform.viewTable', { defaultValue: 'Yagona jadval' })}</span>
                </button>
              </div>
            </div>
          )}

          <StoresFiltersBar
            t={p.t}
            search={p.search}
            onSearchChange={p.handleSearchChange}
            showCompanySelect={showCompanySelect}
            companies={p.companies}
            companyId={p.companyId}
            onCompanyChange={p.handleCompanyChange}
            businessTypes={p.businessTypes}
            businessType={p.businessType}
            onBusinessTypeChange={p.handleBusinessTypeChange}
            regionCode={p.regionCode}
            districtCode={p.districtCode}
            onGeoChange={p.handleGeoChange}
          />
        </div>

        {/* 3. Stores View: Grouped by Company vs Flat Table */}
        {p.isError ? (
          <PlatformErrorState
            error={p.error}
            onRetry={p.refetch}
            retryLoading={p.isPending}
          />
        ) : showCompanySelect && p.viewMode === 'grouped' ? (
          <PlatformStoresGroupedView
            t={p.t}
            stores={p.allStores}
            companies={p.companies}
            companyId={p.companyId}
            search={p.search}
            businessType={p.businessType}
            regionCode={p.regionCode}
            districtCode={p.districtCode}
            statusFilter={p.statusFilter}
            isPending={p.isPending}
            menuId={p.menuId}
            onMenuOpenChange={p.setMenuId}
            onEdit={p.openEdit}
            onToggleActive={(id) => p.toggleMutation.mutate(id)}
            onDelete={p.tryDelete}
            onPharmacyIntegration={p.openPharmacyIntegration}
            onSelectStore={p.openQuickDrawer}
            openCreateForCompany={(companyId) => p.openCreate({ companyId: String(companyId) })}
          />
        ) : (
          <StoresTable
            t={p.t}
            isPending={p.isPending}
            rows={p.rows}
            page={p.page}
            pageSize={p.pageSize}
            total={p.total}
            totalPages={p.totalPages}
            showCompany={showCompanySelect}
            onPageChange={p.setPage}
            onPageSizeChange={p.setPageSize}
            menuId={p.menuId}
            onMenuOpenChange={p.setMenuId}
            onEdit={p.openEdit}
            onToggleActive={(id) => p.toggleMutation.mutate(id)}
            onDelete={p.tryDelete}
            onPharmacyIntegration={p.openPharmacyIntegration}
            onSelectStore={p.openQuickDrawer}
          />
        )}
      </div>

      <StoreFormModal
        open={p.modalOpen}
        onClose={p.closeModal}
        onSubmit={(payload) => p.saveMutation.mutate(payload)}
        isPending={p.saveMutation.isPending}
        initial={p.editing}
        showCompanySelect={p.showCompanySelect}
        companies={p.companies}
      />

      <PharmacyIntegrationSettingsModal
        open={Boolean(p.pharmacyIntegrationStore)}
        store={p.pharmacyIntegrationStore}
        onClose={p.closePharmacyIntegration}
      />

      {/* 4. Quick Drawer for Branch Details */}
      <PlatformStoreQuickDrawer
        open={Boolean(p.selectedStore)}
        store={p.selectedStore}
        onClose={p.closeQuickDrawer}
        onEdit={p.openEdit}
        onToggleActive={(id) => p.toggleMutation.mutate(id)}
        onPharmacyIntegration={p.openPharmacyIntegration}
        t={p.t}
      />
    </PageLayout>
  );
}
