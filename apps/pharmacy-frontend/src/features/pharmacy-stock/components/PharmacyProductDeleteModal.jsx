import { BaseButton, BaseModal } from '../../../components/ui';
import '../styles/pharmacy-product-delete.css';

export default function PharmacyProductDeleteModal({
  open,
  onClose,
  t,
  saving,
  products,
  onConfirm,
}) {
  const rows = (products || []).filter(Boolean);
  const count = rows.length;
  const name = rows[0]?.name || rows[0]?.sku || '';
  const hint = count > 1
    ? t('pharmacyStock.deleteProductsHint', { count })
    : t('pharmacyStock.deleteProductHint', { name });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('pharmacyStock.deleteProductTitle')}
      size="sm"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton variant="danger" onClick={onConfirm} disabled={saving || count === 0}>
            {saving ? t('common.saving') : t('pharmacyStock.deleteProduct')}
          </BaseButton>
        </>
      )}
    >
      <div className="pharmacy-product-delete">
        <p className="pharmacy-product-delete__text">{hint}</p>
        <p className="pharmacy-product-delete__note">{t('pharmacyStock.deleteProductNote')}</p>
      </div>
    </BaseModal>
  );
}
