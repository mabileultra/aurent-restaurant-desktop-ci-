import { BaseButton, BaseModal } from '../../../components/ui';

/** Импорт остатков: создаём черновик начальных остатков и открываем мастер файла. */
export default function PharmacyProductsImportConfirmModal({
  open,
  onClose,
  t,
  saving,
  onConfirm,
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('pharmacyStock.importConfirmTitle')}
      size="sm"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton onClick={onConfirm} disabled={saving}>
            {saving ? t('common.saving') : t('pharmacyStock.importConfirmAction')}
          </BaseButton>
        </>
      )}
    >
      <div className="pharmacy-product-delete">
        <p className="pharmacy-product-delete__text">{t('pharmacyStock.importConfirmHint')}</p>
        <p className="pharmacy-product-delete__note">{t('pharmacyStock.importConfirmNote')}</p>
      </div>
    </BaseModal>
  );
}
