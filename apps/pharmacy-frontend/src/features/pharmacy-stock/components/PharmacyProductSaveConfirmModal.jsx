import { BaseButton, BaseModal } from '../../../components/ui';

/** Явное подтверждение перед сохранением изменений карточки. */
export default function PharmacyProductSaveConfirmModal({
  open,
  onClose,
  t,
  saving,
  productName,
  onConfirm,
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('pharmacyStock.saveProductTitle')}
      size="sm"
      overlayClassName="!z-[80]"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton onClick={onConfirm} disabled={saving}>
            {saving ? t('common.saving') : t('pharmacyStock.saveProductConfirm')}
          </BaseButton>
        </>
      )}
    >
      <div className="pharmacy-product-delete">
        <p className="pharmacy-product-delete__text">
          {t('pharmacyStock.saveProductHint', { name: productName || '—' })}
        </p>
        <p className="pharmacy-product-delete__note">{t('pharmacyStock.saveProductNote')}</p>
      </div>
    </BaseModal>
  );
}
