import { BaseButton } from '../../../../../components/ui';

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
    <>
      {step === 'preview' ? (
        <BaseButton
          type="button"
          variant="secondary"
          className="mr-auto"
          onClick={() => setStep('setup')}
        >
          {t('products.import.back')}
        </BaseButton>
      ) : null}
      <BaseButton type="button" variant="secondary" onClick={onClose}>
        {t('products.import.close')}
      </BaseButton>
      {step === 'setup' ? (
        <BaseButton type="button" variant="primary" onClick={pickFile}>
          {t('products.import.pickFile')}
        </BaseButton>
      ) : (
        <BaseButton
          type="button"
          variant="primary"
          onClick={runImport}
          disabled={!canImport || importing || allDuplicates}
          title={allDuplicates ? t('products.import.invoiceAllDuplicates') : undefined}
        >
          {importing
            ? '…'
            : t(mode === 'AS_RECEIPT' ? 'products.import.confirmReceipt' : 'products.import.confirmImport')}
        </BaseButton>
      )}
    </>
  );
}
