import { BaseButton, BaseModal } from '../../../components/ui';
import '../styles/pharmacy-receipt-delete.css';

/** Жёсткое подтверждение удаления строки прихода (черновик / проведённый). */
export default function PharmacyReceiptLineDeleteModal({
  open,
  onClose,
  t,
  saving,
  lineName,
  posted,
  multi = false,
  onConfirm,
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('pharmacyStock.deleteLineTitle')}
      size="sm"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton variant="danger" onClick={onConfirm} disabled={saving}>
            {saving ? t('common.saving') : t('pharmacyStock.deleteLineAction')}
          </BaseButton>
        </>
      )}
    >
      <div className="pharmacy-receipt-delete">
        <p className="pharmacy-receipt-delete__text">
          {t('pharmacyStock.deleteLineConfirm', { name: lineName || '—' })}
        </p>
        <p className="pharmacy-receipt-delete__note">
          {posted
            ? t(multi ? 'pharmacyStock.deleteSelectedPostedNote' : 'pharmacyStock.deleteLinePostedNote')
            : t('pharmacyStock.deleteLineDraftNote')}
        </p>
      </div>
    </BaseModal>
  );
}
