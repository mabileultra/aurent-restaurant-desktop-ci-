import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { invalidateProductCaches } from '../../../utils/productCache';
import { BaseButton } from '../../../components/ui';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import PharmacyListToolbar from '../components/PharmacyListToolbar';
import PharmacyBulkNumberModal from '../components/PharmacyBulkNumberModal';
import PharmacyProductModal from '../components/PharmacyProductModal';
import PharmacyProductDeleteModal from '../components/PharmacyProductDeleteModal';
import PharmacyProductsImportConfirmModal from '../components/PharmacyProductsImportConfirmModal';
import PharmacyProductsSupplierCards from '../components/PharmacyProductsSupplierCards';
import PharmacyProductsTable from '../components/PharmacyProductsTable';
import PharmacyStockLayout from '../components/PharmacyStockLayout';
import { PharmacySelectionBar } from '../components/PharmacyTableSelect';
import { usePharmacyRowSelection } from '../hooks/usePharmacyRowSelection';
import { usePharmacyProductDelete } from '../hooks/usePharmacyProductDelete';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import {
  PHARM_DEFAULT_PAGE_SIZE,
  PHARM_PAGE_SIZES,
} from '../utils/pharmacyTablePage';
import { downloadPharmacyProductsCsv } from '../utils/pharmacyProductsExportCsv';
import { productReceiptOrigin } from '../utils/productReceiptOrigin';

export default function PharmacyProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { stores, onlyStore, resolveStoreId } = useCompanyStores();
  const storeId = resolveStoreId(onlyStore?.id) ?? stores?.[0]?.id ?? null;
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('ACTIVE');
  const [supplierId, setSupplierId] = useState('');
  const [receiptId, setReceiptId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PHARM_DEFAULT_PAGE_SIZE);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [bulkVatOpen, setBulkVatOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const editId = location.state?.editProductId;
    if (!editId) return undefined;
    let cancelled = false;
    pharmacyWarehouseApi.getProduct(editId)
      .then((r) => {
        if (!cancelled && r?.data) setEditing(r.data);
      })
      .catch(() => {});
    navigate(location.pathname, { replace: true, state: {} });
    return () => { cancelled = true; };
  }, [location.state, location.pathname, navigate]);

  const filters = useMemo(() => ([
    { value: '', label: t('pharmacyStock.filterAll') },
    { value: 'ACTIVE', label: t('pharmacyStock.filterActive') },
    { value: 'DELETED', label: t('pharmacyStock.filterInactive') },
  ]), [t]);

  const supplierStatsQuery = useQuery({
    queryKey: ['pharmacy-product-supplier-stats'],
    queryFn: () => pharmacyWarehouseApi.productSupplierStats().then((r) => r.data),
  });

  const receiptsQuery = useQuery({
    queryKey: ['pharmacy-receipts-filter', supplierId],
    queryFn: () => pharmacyWarehouseApi.listReceipts({
      page: 0,
      size: 100,
      supplierId: supplierId || undefined,
    }).then((r) => r.data),
  });

  const listQuery = useQuery({
    queryKey: ['pharmacy-products', search, scope, supplierId, receiptId, page, pageSize],
    queryFn: () => pharmacyWarehouseApi.listProducts({
      search: search.trim() || undefined,
      page,
      size: pageSize,
      scope,
      activeOnly: scope === 'ACTIVE',
      fromReceipts: false,
      supplierId: supplierId || undefined,
      receiptId: receiptId || undefined,
    }).then((r) => r.data),
  });

  const rows = listQuery.data?.content ?? [];
  const total = listQuery.data?.totalElements ?? rows.length;
  const totalPages = Math.max(1, listQuery.data?.totalPages ?? 1);
  const selection = usePharmacyRowSelection(
    rows,
    `${search}:${scope}:${supplierId}:${receiptId}:${pageSize}`,
  );
  const productDelete = usePharmacyProductDelete(t, {
    onDone: () => {
      selection.clearSelection();
      qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-product-supplier-stats'] });
    },
  });

  const receipts = useMemo(() => {
    const raw = receiptsQuery.data;
    return Array.isArray(raw) ? raw : (raw?.content ?? []);
  }, [receiptsQuery.data]);

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
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      const storeId = resolveStoreId(onlyStore?.id);
      if (!storeId) {
        throw new Error(t('stockModal.pickStore'));
      }
      return pharmacyWarehouseApi.createDraft({
        storeId,
        receiptType: 'OPENING',
        paymentType: 'CASH',
      });
    },
    onSuccess: (res) => {
      toast.success(t('pharmacyStock.importDraftCreated', { no: res.data.receiptNumber }));
      setImportOpen(false);
      navigate(PHARMACY_STOCK_PATHS.receipt(res.data.id), { state: { openImport: true } });
    },
    onError: (e) => toast.error(
      e?.message && !e?.response ? e.message : resolvePharmacyApiError(e, t),
    ),
  });

  const refreshLists = () => {
    qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
    qc.invalidateQueries({ queryKey: ['pharmacy-products'] });
    qc.invalidateQueries({ queryKey: ['pharmacy-product-supplier-stats'] });
  };

  return (
    <PharmacyStockLayout
      title={t('pharmacyStock.productsTitle')}
      subtitle={t('pharmacyStock.productsSubtitle')}
    >
      <PharmacyProductsSupplierCards
        t={t}
        stats={supplierStatsQuery.data}
        selectedSupplierId={supplierId}
        selectedReceiptId={receiptId}
        onSelectSupplier={(id) => {
          setSupplierId(id);
          setReceiptId('');
          setPage(0);
        }}
        onSelectReceipt={(id) => {
          setReceiptId(id);
          setSupplierId('');
          setPage(0);
        }}
      />

      <PharmacyListToolbar
        t={t}
        createLabel={t('pharmacyStock.addProduct')}
        onCreate={() => setCreating(true)}
        onImport={() => setImportOpen(true)}
        importLabel={t('pharmacyStock.importOpening')}
        onExport={() => {
          if (!rows.length) {
            toast.error(t('pharmacyStock.exportEmpty'));
            return;
          }
          downloadPharmacyProductsCsv(rows);
          toast.success(t('pharmacyStock.exportDone', { count: rows.length }));
        }}
        onRefresh={() => {
          listQuery.refetch();
          supplierStatsQuery.refetch();
        }}
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

      <div className="pharmacy-stock__toolbar pharmacy-stock__toolbar--secondary">
        <label className="pharmacy-stock__filter-field">
          <span>{t('pharmacyStock.filterByReceipt')}</span>
          <select
            value={receiptId}
            onChange={(e) => {
              setReceiptId(e.target.value);
              setPage(0);
            }}
          >
            <option value="">{t('pharmacyStock.filterAllReceipts')}</option>
            {receipts.map((r) => (
              <option key={r.id} value={r.id}>
                {r.receiptNumber}
                {r.documentDate ? ` · ${r.documentDate}` : ''}
                {r.supplierName ? ` · ${r.supplierName}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PharmacySelectionBar t={t} selection={selection}>
        <BaseButton size="sm" variant="secondary" onClick={() => setBulkVatOpen(true)}>
          {t('pharmacyStock.bulkVat')}
        </BaseButton>
        <BaseButton
          size="sm"
          variant="danger"
          disabled={productDelete.deleting}
          onClick={() => productDelete.ask(selection.selectedRows)}
        >
          {t('pharmacyStock.deleteSelected')}
        </BaseButton>
      </PharmacySelectionBar>

      <PharmacyProductsTable
        t={t}
        rows={rows}
        loading={listQuery.isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        pageSizes={PHARM_PAGE_SIZES}
        selection={selection}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        onEdit={setEditing}
        onOpenReceipt={(row) => {
          const origin = productReceiptOrigin(row);
          if (origin.receiptId) navigate(PHARMACY_STOCK_PATHS.receipt(origin.receiptId));
        }}
        onDelete={(row) => productDelete.ask(row)}
      />

      <PharmacyProductModal
        open={creating}
        product={null}
        storeId={storeId}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          refreshLists();
        }}
      />
      <PharmacyProductModal
        open={Boolean(editing)}
        product={editing}
        storeId={storeId}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refreshLists();
        }}
      />
      <PharmacyProductDeleteModal
        open={productDelete.pending.length > 0}
        onClose={productDelete.close}
        t={t}
        saving={productDelete.deleting}
        products={productDelete.pending}
        onConfirm={productDelete.confirm}
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
      <PharmacyProductsImportConfirmModal
        open={importOpen}
        onClose={() => !importMutation.isPending && setImportOpen(false)}
        t={t}
        saving={importMutation.isPending}
        onConfirm={() => importMutation.mutate()}
      />
    </PharmacyStockLayout>
  );
}
