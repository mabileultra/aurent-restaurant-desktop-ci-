import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { BaseButton, PageLayout } from '../../../components/ui';
import PlatformCompactFilterBar from '../components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../utils/businessTypeFilterOptions';
import PlatformCompanyFormModal from '../components/PlatformCompanyFormModal';
import PlatformCompaniesTable from '../components/PlatformCompaniesTable';
import PlatformCompanyStatsCards from '../components/PlatformCompanyStatsCards';
import PlatformCompanyQuickDrawer from '../components/PlatformCompanyQuickDrawer';
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
        <BaseButton onClick={p.openCreate} className="admin-btn-primary">
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
                {p.totalCompanies}
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
                {p.activeCompanies}
              </span>
            </button>
            <button
              type="button"
              onClick={() => p.setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                p.statusFilter === 'INACTIVE'
                  ? p.inactiveCompanies > 0
                    ? 'bg-white dark:!bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'bg-white dark:!bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : p.inactiveCompanies > 0
                    ? 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.t('platform.tabInactive', { defaultValue: 'Nofaol' })}
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  p.inactiveCompanies > 0
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {p.inactiveCompanies}
              </span>
            </button>
          </div>
        </div>

        <PlatformCompactFilterBar
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
        isError={p.isError}
        error={p.error}
        onRetry={p.refetch}
        rows={p.rows}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onDelete={p.tryDelete}
        onSelectCompany={p.setSelectedCompany}
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
      />

      {/* 5. Quick Peek Slide-Over Drawer */}
      <PlatformCompanyQuickDrawer
        open={Boolean(p.selectedCompany)}
        company={p.selectedCompany}
        onClose={() => p.setSelectedCompany(null)}
        onEdit={(comp) => {
          p.setSelectedCompany(null);
          p.openEdit(comp);
        }}
        t={p.t}
      />
    </PageLayout>
  );
}
