import toast from 'react-hot-toast';
import { BaseModal } from '../../../components/ui';
import PharmacyReceiptLineFields from './PharmacyReceiptLineFields';
import { usePharmacyReceiptLineForm } from '../hooks/usePharmacyReceiptLineForm';
import '../styles/pharmacy-stock.css';

export default function PharmacyReceiptLineModal({
  open,
  onClose,
  t,
  product,
  existingLine = null,
  defaultMarkup,
  saving,
  onSave,
  onAboutProduct,
}) {
  const line = usePharmacyReceiptLineForm({
    open,
    product,
    existingLine,
    defaultMarkup,
  });

  const titleProduct = existingLine?.productName || product?.name || '';

  if (!open || (!product && !existingLine)) return null;

  const handleSave = () => {
    const result = line.buildPayload(t);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onSave(result.payload, existingLine?.id || null);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={existingLine ? t('pharmacyStock.lineModalEditTitle') : t('pharmacyStock.lineModalTitle')}
      size="sm"
      className="pharmacy-stock pharm-line-modal"
      bodyClassName="pharm-line-modal__body"
      footerClassName="pharm-line-modal__footer-bar"
      footer={(
        <>
          <button
            type="button"
            className="pharm-line-btn pharm-line-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button
            type="button"
            className="pharm-line-btn"
            onClick={() => onAboutProduct?.()}
            disabled={saving}
          >
            {t('pharmacyStock.aboutProduct')}
          </button>
          <button
            type="button"
            className="pharm-line-btn"
            onClick={onClose}
            disabled={saving}
          >
            {t('common.cancel')}
          </button>
        </>
      )}
    >
      <PharmacyReceiptLineFields t={t} line={line} productName={titleProduct} />
    </BaseModal>
  );
}
