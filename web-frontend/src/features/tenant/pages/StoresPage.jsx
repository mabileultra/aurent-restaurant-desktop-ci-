import React from 'react';
import { Plus } from 'lucide-react';
import { BaseButton, PageLayout, PlatformErrorState } from '../../../components/ui';
import StoreFormModal from '../components/stores/StoreFormModal';
import PharmacyIntegrationSettingsModal from '../components/stores/PharmacyIntegrationSettingsModal';
import StoresFiltersBar from '../components/stores/StoresFiltersBar';
import StoresTable from '../components/stores/StoresTable';
import PlatformStoreStatsCards from '../components/stores/PlatformStoreStatsCards';
import PlatformStoreQuickDrawer from '../components/stores/PlatformStoreQuickDrawer';
import PlatformStoresGroupedView from '../components/stores/PlatformStoresGroupedView';
import StoresPageControls from '../components/stores/StoresPageControls';
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
            <StoresPageControls
              t={p.t}
              statusFilter={p.statusFilter}
              onStatusFilterChange={p.setStatusFilter}
              totalStores={p.totalStores}
              activeStores={p.activeStores}
              inactiveStores={p.inactiveStores}
              viewMode={p.viewMode}
              onViewModeChange={p.setViewMode}
            />
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
            totalStores={p.totalStores}
            byCompanyData={p.byCompanyData}
            byCompanyLoading={p.byCompanyLoading}
            byCompanyFetching={p.byCompanyFetching}
            stores={p.allStores}
            companies={p.companies}
            groups={p.groupedGroups}
            serverPaged
            totalGroups={p.totalGroups}
            loadingBranchIds={p.loadingBranchIds}
            companyId={p.companyId}
            expandedIds={p.expandedCompanyIds}
            onExpandedIdsChange={p.setExpandedCompanyIds}
            hasUserToggled={p.hasUserToggledGrouped}
            onHasUserToggledChange={p.setHasUserToggledGrouped}
            page={p.groupedPage}
            onPageChange={p.setGroupedPage}
            pageSize={p.groupedPageSize}
            onPageSizeChange={p.setGroupedPageSize}
            search={p.search}
            businessType={p.businessType}
            regionCode={p.regionCode}
            districtCode={p.districtCode}
            statusFilter={p.statusFilter}
            isPending={p.isPending}
            isRefreshing={p.isRefreshing}
            showOverlay={p.showRefreshingOverlay}
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
            isRefreshing={p.isRefreshing}
            showOverlay={p.showRefreshingOverlay}
            rows={p.rows}
            page={p.page}
            displayPage={p.displayPage}
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
