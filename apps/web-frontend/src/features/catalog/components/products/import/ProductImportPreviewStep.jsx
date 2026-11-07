import ProductImportColumnPicker from './preview/ProductImportColumnPicker';
import ProductImportPagination from './preview/ProductImportPagination';
import ProductImportPreviewControls from './preview/ProductImportPreviewControls';
import ProductImportPreviewTable from './preview/ProductImportPreviewTable';
import ProductImportReceiptMeta from './preview/ProductImportReceiptMeta';
import ProductImportTasnifBar from './preview/ProductImportTasnifBar';
import ProductImportPreviewSummary from './preview/ProductImportPreviewSummary';

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
    setRowQuantity,
    setRowQuantityValue,
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
      <ProductImportPreviewSummary
        t={t}
        preview={preview}
        allDuplicates={allDuplicates}
        defaultStorageLocation={defaultStorageLocation}
        setDefaultStorageLocation={setDefaultStorageLocation}
        applyDefaultLocationToAll={applyDefaultLocationToAll}
        refreshPreview={refreshPreview}
      />

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
          setRowQuantity={setRowQuantity}
          setRowQuantityValue={setRowQuantityValue}
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
