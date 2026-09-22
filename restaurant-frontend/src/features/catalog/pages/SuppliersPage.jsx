import { Filter, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton, ErrorBanner, PageSearchField } from '../../../components/ui';
import SupplierFiltersDrawer from '../components/suppliers/SupplierFiltersDrawer';
import SupplierModal from '../components/suppliers/SupplierModal';
import SuppliersTable from '../components/suppliers/SuppliersTable';
import { useSuppliersPage } from '../hooks/useSuppliersPage';
import { getApiErrorMessage } from '../../../utils/apiError';
import '../styles/suppliers-page.css';

export default function SuppliersPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const s = useSuppliersPage();

  return (
    <div className="rst-suppliers">
      <div className="rst-suppliers__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('suppliersModule.title')}</h1>
          </div>
        )}
        {s.manage ? (
          <BaseButton type="button" onClick={() => s.setAddOpen(true)}>
            <Plus size={16} aria-hidden />
            {t('suppliersModule.add')}
          </BaseButton>
        ) : null}
      </div>

      <div className="rst-suppliers__filters">
        <PageSearchField
          value={s.search}
          onChange={s.handleSearchChange}
          placeholder={t('suppliersModule.searchPh')}
        />
        <BaseButton type="button" variant="secondary" onClick={() => s.setFiltersOpen(true)}>
          <Filter size={16} aria-hidden />
          {t('products.toolbar.filters')}
        </BaseButton>
      </div>

      {s.isError ? (
        <ErrorBanner
          message={getApiErrorMessage(s.error, t('suppliersModule.loadError'))}
        />
      ) : null}

      <SuppliersTable
        t={t}
        loading={s.loading}
        rows={s.rows}
        fmtDate={s.fmtDate}
        showEmptyHint={s.showEmptyHint}
        page={s.page}
        pageSize={s.pageSize}
        total={s.total}
        totalPages={s.totalPages}
        onPageChange={s.setPage}
        onPageSizeChange={s.setPageSize}
      />

      <SupplierFiltersDrawer
        open={s.filtersOpen}
        onClose={() => s.setFiltersOpen(false)}
        filters={s.filters}
        onChange={s.setFilters}
        onReset={s.resetFilters}
        onApply={s.applyFilters}
      />

      <SupplierModal open={s.addOpen} onClose={() => s.setAddOpen(false)} />
    </div>
  );
}
