import { Check, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PrintReceiptToggle from '../payment/PrintReceiptToggle';

export default function PosRegisterPayFooter({
  disabled,
  isPending,
  printReceiptEnabled,
  onPrintReceiptChange,
  onSale,
}) {
  const { t } = useTranslation();

  return (
    <div className="pos-register-pay-footer">
      <button
        type="button"
        className="pos-register-pay-footer__sale"
        disabled={disabled || isPending}
        onClick={onSale}
      >
        {isPending ? (
          <Loader size={20} className="pos-register-pay-footer__spin" aria-hidden />
        ) : (
          <Check size={20} strokeWidth={2.5} aria-hidden />
        )}
        <span>{t('pos.saleAction')}</span>
      </button>
      <PrintReceiptToggle
        checked={printReceiptEnabled}
        onChange={onPrintReceiptChange}
        t={t}
        className="pos-pay-print-toggle--footer"
        disabled={disabled || isPending}
      />
    </div>
  );
}
