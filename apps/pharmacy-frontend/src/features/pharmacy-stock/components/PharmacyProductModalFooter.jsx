import { BaseButton } from '../../../components/ui';

export default function PharmacyProductModalFooter({
  t,
  includeLine,
  isEdit,
  saving,
  onSave,
  onClose,
  onAbout,
  onDelete,
}) {
  if (includeLine) {
    return (
      <>
        <button type="button" className="pharm-line-btn pharm-line-btn--primary" onClick={onSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" className="pharm-line-btn" onClick={onAbout} disabled={saving}>
          {t('pharmacyStock.aboutProduct')}
        </button>
        <button type="button" className="pharm-line-btn" onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </button>
      </>
    );
  }
  if (isEdit) {
    return (
      <div className="pharm-product-modal__footer pharm-product-modal__footer--edit">
        {onDelete ? (
          <BaseButton variant="danger" className="pharm-product-modal__btn-danger" onClick={onDelete} disabled={saving}>
            {t('pharmacyStock.deleteProduct')}
          </BaseButton>
        ) : <span />}
        <BaseButton className="pharm-product-modal__btn-primary min-w-[180px]" onClick={onSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </BaseButton>
      </div>
    );
  }
  return (
    <div className="pharm-product-modal__footer">
      <BaseButton variant="secondary" className="pharm-product-modal__btn-outline" onClick={onClose} disabled={saving}>
        {t('common.cancel')}
      </BaseButton>
      <BaseButton className="pharm-product-modal__btn-primary" onClick={onSave} disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </BaseButton>
    </div>
  );
}
