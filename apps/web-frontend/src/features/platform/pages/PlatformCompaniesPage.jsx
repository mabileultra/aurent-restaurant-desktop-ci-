import React from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../../../components/aa/PageHeader';
import Button from '../../../components/aa/Button';
import PlatformCompanyStatsCards from '../components/PlatformCompanyStatsCards';
import PlatformCompanyToolbar from '../components/PlatformCompanyToolbar';
import PlatformCompaniesTable from '../components/PlatformCompaniesTable';
import PlatformCompanyFormModal from '../components/PlatformCompanyFormModal';
import PlatformCompanyQuickDrawer from '../components/PlatformCompanyQuickDrawer';
import PlatformCompanyDeleteModal from '../components/PlatformCompanyDeleteModal';
import PlatformCompanyToggleActiveModal from '../components/PlatformCompanyToggleActiveModal';
import { usePlatformCompaniesPage } from '../hooks/usePlatformCompaniesPage';

/**
 * PlatformCompaniesPage — Super-admin Kompaniyalar bo‘limi asosiy sahifasi.
 * aa dizayn tizimiga to‘liq moslashtirilgan.
 */
export default function PlatformCompaniesPage() {
  const p = usePlatformCompaniesPage();

  const handleResetFilters = () => {
    p.handleSearchChange('');
    p.handleBusinessTypeChange('');
    p.handleGeoChange({ regionCode: '', districtCode: '' });
    p.setStatusFilter('ALL');
  };

  const hasOtherFilters = Boolean(
    p.search ||
    p.businessType ||
    p.regionCode ||
    p.districtCode
  );

  const hasLoadedMeta = p.totalCompanies != null && p.totalStores != null && !p.isPending;
  const metaDisplay = hasLoadedMeta ? (
    `${p.totalCompanies} ta kompaniya · ${p.totalStores} ta filial`
  ) : (
    <span className="aa-skel aa-skel--text inline-block w-40 h-4" aria-label="Yuklanmoqda">
      —
    </span>
  );

  return (
    <div className="space-y-6">
      {/* 1. PageHeader */}
      <PageHeader
        breadcrumbs={[
          { label: 'Asosiy', to: '/platform/overview' },
          { label: 'Kompaniyalar' },
        ]}
        title="Kompaniyalar"
        meta={metaDisplay}
        actions={(
          <div className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              icon={<Plus size={16} aria-hidden="true" />}
              onClick={p.openCreate}
              className="w-full sm:w-auto h-[44px] aa-desktop:h-10"
            >
              Kompaniya qo‘shish
            </Button>
          </div>
        )}
      />

      {/* 2. KPI kartalar */}
      <PlatformCompanyStatsCards
        t={p.t}
        totalCompanies={p.totalCompanies}
        activeCompanies={p.activeCompanies}
        inactiveCompanies={p.inactiveCompanies}
        totalStores={p.totalStores}
        isPending={p.isPending}
        isError={p.isError}
      />

      {/* 3. Ro‘yxat kartasi: fon surface, 1px line, radius 12 */}
      <div className="bg-aa-surface border border-aa-line rounded-aa-lg overflow-hidden">
        {/* Asboblar paneli (Toolbar) */}
        <PlatformCompanyToolbar
          statusFilter={p.statusFilter}
          onStatusFilterChange={p.setStatusFilter}
          totalCompanies={p.segmentedTotalCompanies ?? p.totalCompanies ?? 0}
          activeCompanies={p.segmentedActiveCompanies ?? p.activeCompanies ?? 0}
          inactiveCompanies={p.segmentedInactiveCompanies ?? p.inactiveCompanies ?? 0}
          totalResults={p.total}
          isPending={p.isPending}
          search={p.search}
          onSearchChange={p.handleSearchChange}
          businessType={p.businessType}
          onBusinessTypeChange={p.handleBusinessTypeChange}
          businessTypes={p.businessTypes}
          regionCode={p.regionCode}
          districtCode={p.districtCode}
          onGeoChange={p.handleGeoChange}
          onReset={handleResetFilters}
        />

        {/* Jadval va holatlar */}
        <PlatformCompaniesTable
          isPending={p.isPending}
          isError={p.isError}
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
          hasOtherFilters={hasOtherFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* 4. Qo‘shish va tahrirlash formasi (Modal 720px) */}
      <PlatformCompanyFormModal
        open={p.modalOpen}
        editing={p.editing}
        form={p.form}
        isSaving={p.saveMutation?.isPending}
        businessTypes={p.businessTypes}
        onClose={p.closeModal}
        onFieldChange={p.updateField}
        onToggleBusinessType={p.toggleBusinessType}
        onSetDefaultBusinessType={p.setDefaultBusinessType}
        onSave={() => p.saveMutation?.mutate()}
      />

      {/* 5. Tezkor ko‘rish o‘ng paneli (Quick Drawer 440px) */}
      {p.selectedCompany && (
        <PlatformCompanyQuickDrawer
          open={Boolean(p.selectedCompany)}
          company={p.selectedCompany}
          onClose={p.closeQuickDrawer}
          onEdit={(comp) => {
            p.closeQuickDrawer();
            p.openEdit(comp);
          }}
          onToggleActive={p.tryToggleActive}
          t={p.t}
        />
      )}

      {/* 6. O‘chirish tasdiqlash modali (Modal 480px) */}
      {p.companyToDelete && (
        <PlatformCompanyDeleteModal
          open={Boolean(p.companyToDelete)}
          company={p.companyToDelete}
          onClose={() => p.setCompanyToDelete(null)}
          onConfirmDelete={p.handleConfirmDelete}
          onToggleActive={p.tryToggleActive}
          isDeleting={p.isDeleting}
        />
      )}

      {/* 7. Faolsizlantirish / Faollashtirish tasdiqlash modali (Modal 480px) */}
      {p.companyToToggleActive && (
        <PlatformCompanyToggleActiveModal
          open={Boolean(p.companyToToggleActive)}
          company={p.companyToToggleActive}
          onClose={() => p.setCompanyToToggleActive(null)}
          onConfirm={p.handleConfirmToggleActive}
          isToggling={p.isTogglingActive}
        />
      )}
    </div>
  );
}
