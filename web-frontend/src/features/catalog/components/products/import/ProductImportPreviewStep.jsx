import { inputCls } from '../../../../../utils/productImportUtils';
import ProductImportColumnPicker from './preview/ProductImportColumnPicker';
import ProductImportPagination from './preview/ProductImportPagination';
import ProductImportPreviewControls from './preview/ProductImportPreviewControls';
import ProductImportPreviewTable from './preview/ProductImportPreviewTable';
import ProductImportReceiptMeta from './preview/ProductImportReceiptMeta';
import ProductImportTasnifBar from './preview/ProductImportTasnifBar';

export default function ProductImportPreviewStep(props) {
  const {
    t,
    mode,
    preview,
    rows,
    allRows,
    allDuplicates,
    markupInput,
    onMarkupInputChange,
    onMarkupInputBlur,
    applyMarkupPreset,
    applyMarkupToAll,
    defaultCategoryId,
    setDefaultCategoryId,
    applyDefaultCategoryToAll,
    categories,
    defaultStoreId,
    setDefaultStoreId,
    applyDefaultStoreToAll,
    stores,
    supplierId,
    setSupplierId,
    paymentType,
    setPaymentType,
    receiptNotes,
    setReceiptNotes,
    defaultStorageLocation,
    setDefaultStorageLocation,
    applyDefaultLocationToAll,
    refreshPreview,
    editable,
    setRowPrice,
    setRowCategory,
    setRowStore,
    setRowStorageLocation,
    setRowBarcode,
    setRowIkpu,
    setRowMarkedProduct,
    visibleColumns,
    toggleColumn,
    tasnifByRow,
    tasnifFilter,
    setTasnifFilter,
    verifyingTasnif,
    verifyProgress,
    runTasnifVerify,
    page,
    totalPages,
    pageSize,
    pageFrom,
    pageTo,
    setPage,
    setPageSize,
    filteredCount,
  } = props;

  return (
    <div className="product-import-preview">
      <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>{t('products.import.previewTotal', { count: preview.totalRows })}</span>
        <span className="text-emerald-600 dark:text-emerald-400">
          {t('products.import.previewNew', { count: preview.newRows })}
        </span>
        <span className="text-amber-600 dark:text-amber-400">
          {t('products.import.previewDuplicate', { count: preview.duplicateRows })}
        </span>
        {preview.invalidRows > 0 && (
          <span className="text-red-600 dark:text-red-400">
            {t('products.import.previewInvalid', { count: preview.invalidRows })}
          </span>
        )}
      </div>
      {preview.uzInvoiceDocumentId ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            preview.invoiceAlreadyImported
              ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-500/15 dark:text-amber-100'
              : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300'
          }`}
        >
          <span className="font-medium">{t('products.import.invoiceDocLabel')}: </span>
          <span className="font-mono">{preview.uzInvoiceDocumentId}</span>
          {preview.invoiceAlreadyImported ? (
            <p className="mt-1 text-xs">
              {t('products.import.invoiceAlreadyImported', { id: preview.uzInvoiceDocumentId })}
            </p>
          ) : null}
        </div>
      ) : null}
      {allDuplicates && preview.duplicateRows > 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-500/10 dark:text-amber-100">
          {t('products.import.invoiceAllDuplicates')}
        </p>
      ) : null}
      <p className="text-xs text-slate-500">{t('products.import.duplicateHint')}</p>
      <p className="text-xs text-slate-500">{t('products.import.priceHint')}</p>
      <p className="text-xs text-slate-500">{t('products.import.storeHint')}</p>

      <div className="product-import-panel flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <p className="product-import-panel__label mb-1">
            {t('products.import.defaultLocation')}
          </p>
          <input
            type="text"
            value={defaultStorageLocation}
            onChange={(e) => setDefaultStorageLocation(e.target.value)}
            onBlur={() => refreshPreview()}
            placeholder={t('products.import.defaultLocationPh')}
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={applyDefaultLocationToAll}
          disabled={!defaultStorageLocation.trim()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
        >
          {t('products.import.applyLocationAll')}
        </button>
      </div>

      <ProductImportPreviewControls
        t={t}
        markupInput={markupInput}
        onMarkupInputChange={onMarkupInputChange}
        onMarkupInputBlur={onMarkupInputBlur}
        applyMarkupPreset={applyMarkupPreset}
        applyMarkupToAll={applyMarkupToAll}
        defaultCategoryId={defaultCategoryId}
        setDefaultCategoryId={setDefaultCategoryId}
        applyDefaultCategoryToAll={applyDefaultCategoryToAll}
        categories={categories}
        defaultStoreId={defaultStoreId}
        setDefaultStoreId={setDefaultStoreId}
        applyDefaultStoreToAll={applyDefaultStoreToAll}
        stores={stores}
        mode={mode}
      />

      {mode === 'AS_RECEIPT' ? (
        <ProductImportReceiptMeta
          t={t}
          supplierId={supplierId}
          setSupplierId={setSupplierId}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          receiptNotes={receiptNotes}
          setReceiptNotes={setReceiptNotes}
        />
      ) : null}

      <ProductImportTasnifBar
        t={t}
        rows={allRows ?? rows}
        editable={editable}
        tasnifByRow={tasnifByRow}
        filter={tasnifFilter}
        onFilter={setTasnifFilter}
        verifying={verifyingTasnif}
        verifyProgress={verifyProgress}
        onVerify={runTasnifVerify}
      />

      <div className="product-import-preview__table-block">
        <div className="product-import-preview-toolbar">
          <p className="text-xs text-slate-500">{t('products.import.tasnif.tableHint')}</p>
          <ProductImportColumnPicker
            t={t}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
        </div>

        <ProductImportPreviewTable
          t={t}
          rows={rows}
          editable={editable}
          categories={categories}
          stores={stores}
          visibleColumns={visibleColumns}
          tasnifByRow={tasnifByRow}
          setRowPrice={setRowPrice}
          setRowCategory={setRowCategory}
          setRowStore={setRowStore}
          setRowStorageLocation={setRowStorageLocation}
          setRowBarcode={setRowBarcode}
          setRowIkpu={setRowIkpu}
          setRowMarkedProduct={setRowMarkedProduct}
        />

        <ProductImportPagination
          t={t}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          from={pageFrom}
          to={pageTo}
          total={filteredCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
