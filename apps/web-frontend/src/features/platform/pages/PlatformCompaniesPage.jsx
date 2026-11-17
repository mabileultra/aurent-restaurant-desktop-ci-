import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { BaseButton, PageLayout } from '../../../components/ui';
import PlatformCompactFilterBar from '../components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../utils/businessTypeFilterOptions';
import PlatformCompaniesStatusTabs from '../components/PlatformCompaniesStatusTabs';
import PlatformCompanyFormModal from '../components/PlatformCompanyFormModal';
import PlatformCompaniesTable from '../components/PlatformCompaniesTable';
import PlatformCompanyStatsCards from '../components/PlatformCompanyStatsCards';
import PlatformCompanyQuickDrawer from '../components/PlatformCompanyQuickDrawer';
import PlatformCompanyDeleteModal from '../components/PlatformCompanyDeleteModal';
import PlatformCompanyToggleActiveModal from '../components/PlatformCompanyToggleActiveModal';
import { usePlatformCompaniesPage } from '../hooks/usePlatformCompaniesPage';
import GeoFilterSelects from '../../shared/geo/GeoFilterSelects';

export default function PlatformCompaniesPage() {
  const p = usePlatformCompaniesPage();
  const navigate = useNavigate();

  return (
    <PageLayout
      spacing="space-y-4"
      title={`${p.t('platform.companiesTitle')}${typeof p.total === 'number' && p.total > 0 ? ` (${p.total})` : ''}`}
      actions={(
        <BaseButton onClick={p.openCreate} className="aa-btn aa-btn--primary">
          <Plus size={16} />
          {p.t('platform.addCompany')}
        </BaseButton>
      )}
    >
      {/* 1. Executive Summary KPI Cards */}
      <PlatformCompanyStatsCards
        t={p.t}
        totalCompanies={p.totalCompanies}
        activeCompanies={p.activeCompanies}
        inactiveCompanies={p.inactiveCompanies}
        totalStores={p.totalStores}
        statusFilter={p.statusFilter}
        onStatusFilterChange={p.setStatusFilter}
        onStoresClick={() => navigate('/platform/stores')}
        isPending={p.isPending}
      />

      {/* 2. Status Segmented Tabs + Filters Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PlatformCompaniesStatusTabs
            statusFilter={p.statusFilter}
            onStatusFilterChange={p.setStatusFilter}
            totalCompanies={p.totalCompanies}
            activeCompanies={p.activeCompanies}
            inactiveCompanies={p.inactiveCompanies}
            t={p.t}
          />
        </div>

        <PlatformCompactFilterBar
          className="platform-filter-bar--aa"
          search={p.search}
          onSearchChange={p.handleSearchChange}
          searchPlaceholder={p.t('platform.companySearch')}
          filterLabel={p.t('platform.filterBusinessType')}
          filterOptions={buildBusinessTypeFilterOptions(p.t, p.businessTypes)}
          filterValue={p.businessType}
          onFilterChange={p.handleBusinessTypeChange}
          onReset={() => {
            p.handleSearchChange('');
            p.handleBusinessTypeChange('');
            p.handleGeoChange({ regionCode: '', districtCode: '' });
            p.setStatusFilter('ALL');
          }}
          resetLabel={p.t('common.reset', { defaultValue: 'Сбросить' })}
          extra={(
            <GeoFilterSelects
              variant="aa"
              size="md"
              regionCode={p.regionCode}
              districtCode={p.districtCode}
              onChange={p.handleGeoChange}
            />
          )}
        />
      </div>

      {/* 3. Modernized Companies Table */}
      <PlatformCompaniesTable
        t={p.t}
        isPending={p.isPending}
        isRefreshing={p.isRefreshing}
        showOverlay={p.showRefreshingOverlay}
        isError={p.isError}
        error={p.error}
        onRetry={p.refetch}
        rows={p.rows}
        page={p.page}
        displayPage={p.displayPage}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onDelete={p.tryDelete}
        onToggleActive={p.tryToggleActive}
        onSelectCompany={p.setSelectedCompany}
        statusFilter={p.statusFilter}
      />

      {/* 4. Edit / Create Modal */}
      <PlatformCompanyFormModal
        open={p.modalOpen}
        editing={p.editing}
        form={p.form}
        isSaving={p.saveMutation.isPending}
        businessTypes={p.businessTypes}
        onClose={p.closeModal}
        onFieldChange={p.updateField}
        onToggleBusinessType={p.toggleBusinessType}
        onSetDefaultBusinessType={p.setDefaultBusinessType}
        onSave={() => p.saveMutation.mutate()}
        isDraftRestored={p.isDraftRestored}
        onClearDraft={p.handleClearDraft}
      />

      {/* 5. Quick Peek Slide-Over Drawer */}
      {p.selectedCompany ? (
        <PlatformCompanyQuickDrawer
          open={Boolean(p.selectedCompany)}
          company={p.selectedCompany}
          onClose={p.closeQuickDrawer}
          onEdit={(comp) => { p.closeQuickDrawer(); p.openEdit(comp); }}
          onToggleActive={p.tryToggleActive}
          t={p.t}
        />
      ) : null}

      {/* 6. Safe Delete / Deactivate Modal */}
      {p.companyToDelete ? (
        <PlatformCompanyDeleteModal
          open={Boolean(p.companyToDelete)}
          company={p.companyToDelete}
          onClose={() => p.setCompanyToDelete(null)}
          onConfirmDelete={p.handleConfirmDelete}
          onToggleActive={p.tryToggleActive}
          isDeleting={p.isDeleting}
          t={p.t}
        />
      ) : null}

      {/* 7. Safe Toggle Active Confirmation Modal */}
      {p.companyToToggleActive ? (
        <PlatformCompanyToggleActiveModal
          open={Boolean(p.companyToToggleActive)}
          company={p.companyToToggleActive}
          onClose={() => p.setCompanyToToggleActive(null)}
          onConfirm={p.handleConfirmToggleActive}
          isToggling={p.isTogglingActive}
          t={p.t}
        />
      ) : null}
    </PageLayout>
  );
}
