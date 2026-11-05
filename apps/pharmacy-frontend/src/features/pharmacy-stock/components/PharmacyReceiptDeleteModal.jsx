import { BaseButton, BaseModal } from '../../../components/ui';
import '../styles/pharmacy-receipt-delete.css';

export default function PharmacyReceiptDeleteModal({ open, onClose, t, saving, numbers, posted, onConfirm }) {
  const list = (numbers || []).filter(Boolean).join(', ');
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('pharmacyStock.deleteReceiptTitle')}
      size="sm"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton variant="danger" onClick={onConfirm} disabled={saving}>
            {saving ? t('common.saving') : t('pharmacyStock.deleteReceipt')}
          </BaseButton>
        </>
      )}
    >
      <div className="pharmacy-receipt-delete">
        <p className="pharmacy-receipt-delete__text">
          {t('pharmacyStock.deleteReceiptHint', { no: list })}
        </p>
        {posted ? (
          <p className="pharmacy-receipt-delete__note">{t('pharmacyStock.deleteReceiptPostedNote')}</p>
        ) : null}
      </div>
    </BaseModal>
  );
}
