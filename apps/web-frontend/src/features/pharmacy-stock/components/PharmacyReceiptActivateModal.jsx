import { BaseButton, BaseModal } from '../../../components/ui';
import '../styles/pharmacy-receipt-activate.css';

export default function PharmacyReceiptActivateModal({
  open,
  onClose,
  t,
  saving,
  marksProgress,
  onConfirm,
}) {
  const marked = Number(marksProgress?.marked) > 0;
  const have = Number(marksProgress?.have) || 0;
  const need = Number(marksProgress?.need) || 0;
  const incomplete = marked && have < need;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('pharmacyStock.activateTitle')}
      size="sm"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton onClick={onConfirm} disabled={saving}>
            {saving ? t('common.saving') : t('pharmacyStock.activateConfirm')}
          </BaseButton>
        </>
      )}
    >
      <p className="pharmacy-receipt-activate__text">{t('pharmacyStock.activateHint')}</p>
      {incomplete ? (
        <p className="pharmacy-receipt-activate__ask">
          {t('pharmacyStock.activateMarksOptional', { have, need })}
        </p>
      ) : null}
      {marked ? (
        <p className="pharmacy-receipt-activate__note">{t('pharmacyStock.activateMarksNotSale')}</p>
      ) : null}
    </BaseModal>
  );
}
