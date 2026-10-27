export default function ProductImportModalFooter({
  step,
  setStep,
  onClose,
  pickFile,
  runImport,
  canImport,
  allDuplicates,
  importing,
  mode,
  t,
}) {
  return (
    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
      {step === 'preview' && (
        <button
          type="button"
          onClick={() => setStep('setup')}
          className="admin-btn-secondary mr-auto px-4 py-2 text-sm"
        >
          {t('products.import.back')}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="admin-btn-secondary px-4 py-2 text-sm"
      >
        {t('products.import.close')}
      </button>
      {step === 'setup' ? (
        <button
          type="button"
          onClick={pickFile}
          className="admin-btn-primary px-4 py-2 text-sm"
        >
          {t('products.import.pickFile')}
        </button>
      ) : (
        <button
          type="button"
          onClick={runImport}
          disabled={!canImport || importing || allDuplicates}
          title={allDuplicates ? t('products.import.invoiceAllDuplicates') : undefined}
          className="admin-btn-primary px-4 py-2 text-sm"
        >
          {importing ? '…' : t(mode === 'AS_RECEIPT' ? 'products.import.confirmReceipt' : 'products.import.confirmImport')}
        </button>
      )}
    </div>
  );
}
