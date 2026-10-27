import '../../../../styles/catalog/product-import.css';
import { BaseModal } from '../../../../components/ui';
import { useProductImport } from '../../hooks/useProductImport';
import ProductImportModalFooter from './import/ProductImportModalFooter';
import ProductImportSetupStep from './import/ProductImportSetupStep';
import ProductImportPreviewStep from './import/ProductImportPreviewStep';

export default function ProductImportModal({ categories = [], stores = [], onClose }) {
  const imp = useProductImport(onClose);

  return (
    <BaseModal
      open
      title={imp.t('products.import.title')}
      onClose={onClose}
      size="full"
      className="product-import-modal"
      bodyClassName="product-import-modal__body"
      footerClassName="product-import-modal__footer"
      footer={(
        <ProductImportModalFooter
          step={imp.step}
          setStep={imp.setStep}
          onClose={onClose}
          pickFile={imp.pickFile}
          runImport={imp.runImport}
          canImport={imp.canImport}
          allDuplicates={imp.allDuplicates}
          importing={imp.importing}
          mode={imp.mode}
          t={imp.t}
        />
      )}
    >
      {imp.step === 'setup' && (
        <ProductImportSetupStep
          t={imp.t}
          source={imp.source}
          setSource={imp.setSource}
          mode={imp.mode}
          setMode={imp.setMode}
        />
      )}

      {imp.step === 'preview' && imp.preview && (
        <ProductImportPreviewStep
          t={imp.t}
          mode={imp.mode}
          preview={imp.preview}
          rows={imp.rows}
          allRows={imp.allRows}
          allDuplicates={imp.allDuplicates}
          markupInput={imp.markupInput}
          onMarkupInputChange={imp.onMarkupInputChange}
          onMarkupInputBlur={imp.onMarkupInputBlur}
          applyMarkupPreset={imp.applyMarkupPreset}
          applyMarkupToAll={imp.applyMarkupToAll}
          defaultCategoryId={imp.defaultCategoryId}
          setDefaultCategoryId={imp.setDefaultCategoryId}
          applyDefaultCategoryToAll={imp.applyDefaultCategoryToAll}
          categories={categories}
          defaultStoreId={imp.defaultStoreId}
          setDefaultStoreId={imp.setDefaultStoreId}
          applyDefaultStoreToAll={imp.applyDefaultStoreToAll}
          stores={stores}
          supplierId={imp.supplierId}
          setSupplierId={imp.setSupplierId}
          paymentType={imp.paymentType}
          setPaymentType={imp.setPaymentType}
          receiptNotes={imp.receiptNotes}
          setReceiptNotes={imp.setReceiptNotes}
          defaultStorageLocation={imp.defaultStorageLocation}
          setDefaultStorageLocation={imp.setDefaultStorageLocation}
          applyDefaultLocationToAll={imp.applyDefaultLocationToAll}
          refreshPreview={imp.refreshPreview}
          editable={imp.editable}
          setRowPrice={imp.setRowPrice}
          setRowCategory={imp.setRowCategory}
          setRowStore={imp.setRowStore}
          setRowStorageLocation={imp.setRowStorageLocation}
          setRowBarcode={imp.setRowBarcode}
          setRowIkpu={imp.setRowIkpu}
          setRowMarkedProduct={imp.setRowMarkedProduct}
          visibleColumns={imp.visibleColumns}
          toggleColumn={imp.toggleColumn}
          tasnifByRow={imp.tasnifByRow}
          tasnifFilter={imp.tasnifFilter}
          setTasnifFilter={imp.setTasnifFilter}
          verifyingTasnif={imp.verifyingTasnif}
          verifyProgress={imp.verifyProgress}
          runTasnifVerify={imp.runTasnifVerify}
          page={imp.page}
          totalPages={imp.totalPages}
          pageSize={imp.pageSize}
          pageFrom={imp.pageFrom}
          pageTo={imp.pageTo}
          setPage={imp.setPage}
          setPageSize={imp.setPageSize}
          filteredCount={imp.filteredCount}
        />
      )}

      <input
        ref={imp.fileRef}
        type="file"
        className="hidden"
        accept=".xlsx,.xls,.json,.pdf,application/pdf"
        onChange={imp.onFile}
      />
    </BaseModal>
  );
}
