import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { readImageDataUrl } from '../../../utils/readImageDataUrl';
import {
  RECEIPT_LOGO_HEIGHT_MAX_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
} from '../../../store/tenantDisplayStore';

export default function ReceiptCompanyLogoField({
  dataUrl,
  maxHeightMm,
  onSet,
  onClear,
  onHeight,
  disabled,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await readImageDataUrl(file);
      onSet(url);
      toast.success(t('rst.admin.receiptCompanyLogoOk', { defaultValue: 'Логотип загружен' }));
    } catch (err) {
      if (err?.message === 'TOO_LARGE') {
        toast.error(t('rst.admin.receiptCompanyLogoLarge', { defaultValue: 'Файл больше 512 КБ' }));
      } else if (err?.message === 'NOT_IMAGE') {
        toast.error(t('rst.admin.receiptCompanyLogoType', { defaultValue: 'Нужен PNG или JPG' }));
      } else {
        toast.error(t('rst.admin.receiptCompanyLogoFail', { defaultValue: 'Не удалось загрузить' }));
      }
    }
  };

  return (
    <div className="rst-receipt-company__logo">
      <span className="rst-receipt-company__field-label">
        {t('rst.admin.receiptCompanyLogo', { defaultValue: 'Логотип на чеке' })}
      </span>
      <div className="rst-receipt-company__logo-row">
        <div className="rst-receipt-company__logo-preview">
          {dataUrl ? <img src={dataUrl} alt="" /> : null}
        </div>
        <div className="rst-receipt-company__logo-actions">
          <label className="rst-receipt-company__file">
            {t('rst.admin.receiptCompanyLogoUpload', { defaultValue: 'Загрузить' })}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={disabled}
              onChange={onPick}
            />
          </label>
          {dataUrl ? (
            <button type="button" onClick={onClear} disabled={disabled}>
              {t('rst.admin.receiptCompanyLogoRemove', { defaultValue: 'Удалить' })}
            </button>
          ) : null}
        </div>
      </div>
      <label className="rst-receipt-company__field">
        <span>
          {t('rst.admin.receiptCompanyLogoHeight', { defaultValue: 'Высота логотипа' })}
          {': '}
          {maxHeightMm}
          {' '}
          мм
        </span>
        <input
          type="range"
          min={RECEIPT_LOGO_HEIGHT_MIN_MM}
          max={RECEIPT_LOGO_HEIGHT_MAX_MM}
          step={1}
          value={maxHeightMm}
          disabled={disabled}
          onChange={(e) => onHeight(e.target.value)}
        />
      </label>
      <p className="rst-receipt-company__hint">
        {t('rst.admin.receiptCompanyLogoHint', {
          defaultValue: 'Включите блок «Логотип» ниже, иначе картинка не попадёт на чек.',
        })}
      </p>
    </div>
  );
}
