import { useState } from 'react';
import CashRegisterErrorBanner from '../components/CashRegisterErrorBanner';
import CashRegisterHintBanner from '../components/CashRegisterHintBanner';
import CashRegisterSearchField from '../components/CashRegisterSearchField';
import CashRegistersTable from '../components/CashRegistersTable';
import CashRegistersListFooter from '../components/CashRegistersListFooter';
import CashRegistersFiltersDrawer from '../components/CashRegistersFiltersDrawer';
import CashRegisterDetailsModal from '../components/CashRegisterDetailsModal';
import CashRegisterFormModal from '../components/CashRegisterFormModal';
import MultikassaSettingsModal from '../components/MultikassaSettingsModal';
import { useCashRegistersListPage } from '../hooks/useCashRegistersListPage';

export default function CashRegistersListPage() {
  const p = useCashRegistersListPage();
  const [multikassaRegisterId, setMultikassaRegisterId] = useState(null);

  const errorMessage =
    p.error?.response?.data?.message ?? p.error?.message ?? p.t('cashRegisters.loadError');

  return (
    <div className="space-y-4">
      {p.isError && <CashRegisterErrorBanner message={errorMessage} />}

      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.t('cashRegisters.title')}</h1>

      <CashRegisterHintBanner
        title={p.t('cashRegisters.listHintTitle')}
        body={p.t('cashRegisters.listHintBody')}
      />

      <CashRegisterSearchField
        value={p.search}
        onChange={(e) => p.onSearchChange(e.target.value)}
        placeholder={p.t('cashRegisters.searchPlaceholder')}
        filterLabel={p.t('products.toolbar.filters')}
        onOpenFilters={() => p.setFiltersOpen(true)}
        addLabel={p.t('cashRegisters.addRegister')}
        onAdd={p.openCreateForm}
      />

      <div className="admin-table-shell">
        <CashRegistersTable
          t={p.t}
          rows={p.rows}
          loading={p.loading}
          togglingId={p.togglingId}
          onRowClick={p.setDetailId}
          onToggleStatus={p.handleToggleStatus}
        />
        <CashRegistersListFooter
          t={p.t}
          fromN={p.fromN}
          toN={p.toN}
          total={p.total}
          page={p.page}
          pageSize={p.pageSize}
          pageSizeOptions={p.pageSizeOptions}
          pageButtons={p.pageButtons}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          onPageSizeChange={p.setPageSize}
        />
      </div>

      {/* Keep details open underneath — settings modal is portaled to body */}
      <CashRegisterDetailsModal
        registerId={p.detailId}
        onClose={() => p.setDetailId(null)}
        onEdit={p.openEditForm}
        onMultikassa={(id) => {
          setMultikassaRegisterId(id);
        }}
      />

      <MultikassaSettingsModal
        open={Boolean(multikassaRegisterId)}
        cashRegisterId={multikassaRegisterId}
        onClose={() => setMultikassaRegisterId(null)}
      />

      <CashRegisterFormModal open={p.formOpen} registerId={p.formRegisterId} onClose={p.closeForm} />

      <CashRegistersFiltersDrawer
        open={p.filtersOpen}
        onClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onChange={p.setFilters}
        onReset={p.resetFilters}
        onApply={p.applyFilters}
      />
    </div>
  );
}
