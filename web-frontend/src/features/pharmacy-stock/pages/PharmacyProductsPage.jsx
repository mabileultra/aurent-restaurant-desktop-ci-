import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import TablePagination from '../../../components/shared/TablePagination';
import PharmacyListToolbar from '../components/PharmacyListToolbar';
import PharmacyBulkNumberModal from '../components/PharmacyBulkNumberModal';
import PharmacyProductModal from '../components/PharmacyProductModal';
import PharmacyStockLayout from '../components/PharmacyStockLayout';
import {
  PharmacyEditCell,
  PharmacySelectAllTh,
  PharmacySelectCell,
  PharmacySelectionBar,
} from '../components/PharmacyTableSelect';
import { productAtc } from '../hooks/usePharmacyCatalogOptions';
import { usePharmacyRowSelection } from '../hooks/usePharmacyRowSelection';
import { usePharmacyProductDelete } from '../hooks/usePharmacyProductDelete';
import {
  PHARM_DEFAULT_PAGE_SIZE,
  PHARM_PAGE_SIZES,
} from '../utils/pharmacyTablePage';
import {
  productCountry,
  productDosageForm,
  productManufacturer,
  productUnitsInPack,
} from '../utils/pharmacyReceiptPricing';

const PAGE_SIZES = PHARM_PAGE_SIZES;

export default function PharmacyProductsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PHARM_DEFAULT_PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bulkVatOpen, setBulkVatOpen] = useState(false);

  const filters = useMemo(() => ([
    { value: '', label: t('pharmacyStock.filterAll') },
    { value: 'ACTIVE', label: t('pharmacyStock.filterActive') },
    { value: 'DELETED', label: t('pharmacyStock.filterInactive') },
  ]), [t]);

  const listQuery = useQuery({
    queryKey: ['pharmacy-products', search, scope, page, pageSize],
    queryFn: () => pharmacyWarehouseApi.listProducts({
      search: search.trim() || undefined,
      page,
      size: pageSize,
      scope,
      activeOnly: scope === 'ACTIVE',
    }).then((r) => r.data),
  });

  const rows = listQuery.data?.content ?? [];
  const total = listQuery.data?.totalElements ?? rows.length;
  const totalPages = listQuery.data?.totalPages ?? 1;
  const selection = usePharmacyRowSelection(rows, `${search}:${scope}:${pageSize}`);
  const productDelete = usePharmacyProductDelete(t);

  const bulkVatMutation = useMutation({
    mutationFn: (taxRate) => pharmacyWarehouseApi.bulkTaxRate({
      productIds: selection.selectedRows.map((row) => row.id),
      taxRate: Number(String(taxRate).replace(',', '.')),
    }),
    onSuccess: () => {
      toast.success(t('pharmacyStock.bulkVatSuccess', { count: selection.selectedCount }));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['pharmacy-products'] });
      selection.clearSelection();
      setBulkVatOpen(false);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  return (
    <PharmacyStockLayout
      title={t('pharmacyStock.productsTitle')}
      subtitle={t('pharmacyStock.productsSubtitle')}
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
        searchPlaceholder={t('pharmacyStock.searchPlaceholder')}
        filterOptions={filters}
        filterValue={scope === 'ALL' ? '' : scope}
        onFilterChange={(value) => {
          setScope(value || 'ALL');
          setPage(0);
        }}
      />
      <PharmacySelectionBar t={t} selection={selection}>
        <button
          type="button"
          className="pharmacy-stock__row-btn"
          onClick={() => setBulkVatOpen(true)}
        >
          {t('pharmacyStock.bulkVat')}
        </button>
      </PharmacySelectionBar>

      <div className="pharmacy-stock__panel flex min-h-0 flex-1 flex-col">
        <div className="pharmacy-stock__table-wrap min-h-0 flex-1">
          <table className="pharmacy-stock__table">
            <thead>
              <tr>
                <PharmacySelectAllTh t={t} selection={selection} disabled={rows.length === 0} />
                <th>№</th>
                <th>{t('pharmacyStock.colName')}</th>
                <th>{t('pharmacyStock.colManufacturer')}</th>
                <th>{t('pharmacyStock.colForm')}</th>
                <th>{t('pharmacyStock.productAtc')}</th>
                <th>{t('pharmacyStock.productBarcodes')}</th>
                <th>{t('pharmacyStock.productMxik')}</th>
                <th>{t('pharmacyStock.unitsInPack')}</th>
                <th>{t('pharmacyStock.colCountry')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={12}>
                    <div className="pharmacy-stock__empty">{t('common.loading')}</div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <div className="pharmacy-stock__empty">{t('pharmacyStock.catalogEmpty')}</div>
                  </td>
                </tr>
              ) : rows.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`pharmacy-stock__row--clickable${selection.isSelected(p.id) ? ' pharmacy-stock__row--selected' : ''}`}
                  onClick={() => setEditing(p)}
                >
                  <PharmacySelectCell t={t} row={p} selection={selection} />
                  <td>{page * pageSize + idx + 1}</td>
                  <td className="font-semibold">{p.name}</td>
                  <td>{productManufacturer(p) || '—'}</td>
                  <td>{productDosageForm(p) || '—'}</td>
                  <td>{productAtc(p) || '—'}</td>
                  <td>{p.barcode || '—'}</td>
                  <td>{p.ikpu || '—'}</td>
                  <td>{productUnitsInPack(p) || 1}</td>
                  <td>{productCountry(p) || '—'}</td>
                  <PharmacyEditCell t={t} onEdit={() => setEditing(p)} />
                  <td>
                    {p.active !== false && (
                      <button
                        type="button"
                        className="pharmacy-stock__row-btn"
                        disabled={productDelete.deleting}
                        onClick={(event) => {
                          event.stopPropagation();
                          productDelete.remove(p);
                        }}
                      >
                        {t('pharmacyStock.deleteProduct')}
                      </button>
                    )}
                  </td>
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
          pageSizeOptions={PAGE_SIZES}
        />
      </div>

      <PharmacyProductModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          listQuery.refetch();
        }}
      />
      <PharmacyProductModal
        open={Boolean(editing)}
        product={editing}
        overlayClassName="!z-[60]"
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          listQuery.refetch();
        }}
      />
      <PharmacyBulkNumberModal
        open={bulkVatOpen}
        onClose={() => setBulkVatOpen(false)}
        t={t}
        title={t('pharmacyStock.bulkVatTitle')}
        hint={t('products.bulkVat.hint', { count: selection.selectedCount })}
        fieldLabel={t('pharmacyStock.bulkVatField')}
        max={100}
        saving={bulkVatMutation.isPending}
        onSubmit={(value) => bulkVatMutation.mutate(value)}
      />
    </PharmacyStockLayout>
  );
}
