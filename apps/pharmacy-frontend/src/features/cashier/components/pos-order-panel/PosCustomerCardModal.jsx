import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePosCreditCustomerPicker } from '../../hooks/usePosCreditCustomerPicker';
import PosPaymentCreditCustomerStep from '../payment/PosPaymentCreditCustomerStep';

export default function PosCustomerCardModal({
  open,
  onClose,
  onSelect,
  initialCustomerId = null,
  initialCustomerName = '',
}) {
  const { t } = useTranslation();
  const picker = usePosCreditCustomerPicker({ enabled: open });

  useEffect(() => {
    if (!open) return;
    picker.reset();
    if (initialCustomerId) {
      picker.selectCustomer({ id: initialCustomerId, name: initialCustomerName || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const apply = () => {
    if (!picker.selectedId) return;
    onSelect?.({ id: picker.selectedId, name: picker.selectedName });
    onClose?.();
  };

  const clear = () => {
    onSelect?.({ id: null, name: null });
    onClose?.();
  };

  return (
    <div className="pos-customer-card-modal" role="dialog" aria-modal="true" aria-label={t('pos.customerCardTitle')}>
      <button type="button" className="pos-customer-card-modal__backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="pos-customer-card-modal__panel">
        <header className="pos-customer-card-modal__head">
          <h3 className="pos-customer-card-modal__title">{t('pos.customerCardTitle')}</h3>
          <button type="button" className="pos-customer-card-modal__close" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>
        <div className="pos-customer-card-modal__body">
          <PosPaymentCreditCustomerStep
            t={t}
            hint={t('pos.customerCardHint')}
            search={picker.search}
            setSearch={picker.setSearch}
            customers={picker.customers}
            selectedId={picker.selectedId}
            selectCustomer={picker.selectCustomer}
            isLoading={picker.isLoading}
            isFetching={picker.isFetching}
            isError={picker.isError}
            showCreate={picker.showCreate}
            toggleCreate={picker.toggleCreate}
            createName={picker.createName}
            setCreateName={picker.setCreateName}
            createPhone={picker.createPhone}
            setCreatePhone={picker.setCreatePhone}
            submitCreate={picker.submitCreate}
            isCreating={picker.isCreating}
          />
        </div>
        <footer className="pos-customer-card-modal__foot">
          <button type="button" className="pos-customer-card-modal__btn pos-customer-card-modal__btn--ghost" onClick={clear}>
            {t('pos.customerCardClear')}
          </button>
          <button
            type="button"
            className="pos-customer-card-modal__btn pos-customer-card-modal__btn--primary"
            disabled={!picker.selectedId}
            onClick={apply}
          >
            {t('pos.customerCardApply')}
          </button>
        </footer>
      </div>
    </div>
  );
}
