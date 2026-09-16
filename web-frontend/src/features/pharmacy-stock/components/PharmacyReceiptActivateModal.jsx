import { BaseButton, BaseModal } from '../../../components/ui';

export default function PharmacyReceiptActivateModal({ open, onClose, t, saving, onConfirm }) {
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
      <div className="pharmacy-stock">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('pharmacyStock.activateHint')}</p>
      </div>
    </BaseModal>
  );
}
