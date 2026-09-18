import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi, supplierApi } from '../../../api';
import TablePagination from '../../../components/shared/TablePagination';
import PharmacyListToolbar from '../components/PharmacyListToolbar';
import PharmacyReceiptDeleteModal from '../components/PharmacyReceiptDeleteModal';
import PharmacyReceiptHeaderModal from '../components/PharmacyReceiptHeaderModal';
import PharmacyStockLayout, { PharmacyStatusBadge } from '../components/PharmacyStockLayout';
import {
  PharmacyEditCell,
  PharmacySelectAllTh,
  PharmacySelectCell,
  PharmacySelectionBar,
} from '../components/PharmacyTableSelect';
import { usePharmacyRowSelection } from '../hooks/usePharmacyRowSelection';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import { formatMoney } from '../utils/pharmacyReceiptPricing';
import { PHARM_DEFAULT_PAGE_SIZE, PHARM_PAGE_SIZES } from '../utils/pharmacyTablePage';
import { runLimited } from '../utils/runLimited';

export default function PharmacyReceiptsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PHARM_DEFAULT_PAGE_SIZE);

  const listQuery = useQuery({
    queryKey: ['pharmacy-receipts', statusFilter, search, page, pageSize],
    queryFn: () => pharmacyWarehouseApi.listReceipts({
      status: statusFilter || undefined,
      search: search.trim() || undefined,
      page,
      size: pageSize,
    }).then((r) => r.data),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (rowsToDelete) => {
      await runLimited(rowsToDelete, 8, (row) => pharmacyWarehouseApi.deleteDraft(row.id));
    },
    onSuccess: () => {
      toast.success(t('pharmacyStock.deleteDraftDone'));
      setPendingDelete([]);
      selection.clearSelection();
      qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? e.message ?? t('pharmacyStock.saveFailed')),
  });

  const createMutation = useMutation({
    mutationFn: (body) => pharmacyWarehouseApi.createDraft(body),
    onSuccess: (res) => {
      toast.success(t('pharmacyStock.draftCreated', { no: res.data.receiptNumber }));
      qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
      setCreateOpen(false);
      navigate(PHARMACY_STOCK_PATHS.receipt(res.data.id));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const rows = listQuery.data?.content ?? [];
  const total = listQuery.data?.totalElements ?? rows.length;
  const totalPages = listQuery.data?.totalPages ?? 1;
  const suppliers = suppliersQuery.data?.content ?? [];
  const selection = usePharmacyRowSelection(rows, `${statusFilter}:${search}:${pageSize}`);

  const filters = useMemo(() => ([
    { value: '', label: t('pharmacyStock.filterAll') },
    { value: 'DRAFT', label: t('pharmacyStock.filterDraft') },
    { value: 'POSTED', label: t('pharmacyStock.filterPosted') },
  ]), [t]);

  return (
    <PharmacyStockLayout
      title={t('pharmacyStock.title')}
      subtitle={t('pharmacyStock.subtitle')}
    >
      <PharmacyListToolbar
        t={t}
        createLabel={t('pharmacyStock.toolbarCreate')}
        onCreate={() => setCreateOpen(true)}
        onRefresh={() => listQuery.refetch()}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder={t('pharmacyStock.receiptSearchPh')}
        filterOptions={filters}
        filterValue={statusFilter}
        onFilterChange={(value) => {
          setStatusFilter(value);
          setPage(0);
        }}
      />
      <PharmacySelectionBar t={t} selection={selection}>
        <button
          type="button"
          className="pharmacy-stock__row-btn pharmacy-stock__row-btn--danger"
          onClick={() => setPendingDelete(selection.selectedRows)}
          disabled={deleteSelectedMutation.isPending}
        >
          {t('pharmacyStock.deleteReceipt')}
        </button>
      </PharmacySelectionBar>

      <div className="pharmacy-stock__panel flex min-h-0 flex-1 flex-col">
        <div className="pharmacy-stock__table-wrap min-h-0 flex-1">
          <table className="pharmacy-stock__table">
            <thead>
              <tr>
                <PharmacySelectAllTh t={t} selection={selection} disabled={rows.length === 0} />
                <th>№</th>
                <th>{t('pharmacyStock.colStatus')}</th>
                <th>{t('pharmacyStock.colType')}</th>
                <th>{t('pharmacyStock.colDocNo')}</th>
                <th>{t('pharmacyStock.colDate')}</th>
                <th>{t('stockReports.colSupplier')}</th>
                <th>{t('stockReports.colStore')}</th>
                <th>{t('pharmacyStock.colPurchaseSum')}</th>
                <th>{t('pharmacyStock.colRetailSum')}</th>
                <th>{t('pharmacyStock.colQty')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <div className="pharmacy-stock__empty">
                      {listQuery.isLoading ? t('common.loading') : t('pharmacyStock.empty')}
                    </div>
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`pharmacy-stock__row--clickable${selection.isSelected(row.id) ? ' pharmacy-stock__row--selected' : ''}`}
                  tabIndex={0}
                  role="link"
                  onClick={() => navigate(PHARMACY_STOCK_PATHS.receipt(row.id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(PHARMACY_STOCK_PATHS.receipt(row.id));
                    }
                  }}
                >
                  <PharmacySelectCell t={t} row={row} selection={selection} />
                  <td>{page * pageSize + idx + 1}</td>
                  <td><PharmacyStatusBadge status={row.status} t={t} /></td>
                  <td>{t('pharmacyStock.receiptTypeReceipt')}</td>
                  <td>
                    <span className="pharmacy-stock__link">{row.receiptNumber}</span>
                  </td>
                  <td>{row.documentDate || '—'}</td>
                  <td>{row.supplierName || '—'}</td>
                  <td>{row.storeName || '—'}</td>
                  <td>{formatMoney(row.totalCost)}</td>
                  <td>{formatMoney(row.totalRetail)}</td>
                  <td>{row.totalQuantity ?? 0}</td>
                  <PharmacyEditCell
                    t={t}
                    onEdit={() => navigate(PHARMACY_STOCK_PATHS.receipt(row.id))}
                    onDelete={() => setPendingDelete([row])}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={PHARM_PAGE_SIZES}
        />
      </div>

      <PharmacyReceiptDeleteModal
        open={pendingDelete.length > 0}
        onClose={() => setPendingDelete([])}
        t={t}
        saving={deleteSelectedMutation.isPending}
        numbers={pendingDelete.map((row) => row.receiptNumber)}
        posted={pendingDelete.some((row) => row.status === 'POSTED')}
        onConfirm={() => deleteSelectedMutation.mutate(pendingDelete)}
      />
      <PharmacyReceiptHeaderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        t={t}
        suppliers={suppliers}
        saving={createMutation.isPending}
        onSubmit={(body) => createMutation.mutate(body)}
      />
    </PharmacyStockLayout>
  );
}
