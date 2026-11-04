import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  RECEIPT_FIELD_DEFS,
  useTenantDisplayStore,
} from '../../../store/tenantDisplayStore';
import ReceiptCompanyLogoField from './ReceiptCompanyLogoField';
import ReceiptFieldStyleControls from './ReceiptFieldStyleControls';
import '../styles/receipt-company-profile.css';

const FIELD_LABELS = {
  logo: 'Логотип',
  companyName: 'Название',
  companyAddress: 'Адрес',
  companyPhone: 'Телефон',
  stir: 'СТИР / ИНН',
  dateTime: 'Дата и время',
  receiptNo: '№ чека',
  receiptType: 'Тип чека',
  employee: 'Сотрудник',
  shift: 'Смена',
  items: 'Позиции',
  itemIkpu: 'ИКПУ в строке',
  itemVatLine: 'НДС в строке',
  service: 'Обслуживание %',
  discounts: 'Скидки',
  grandTotal: 'Итого',
  vatTotal: 'НДС итого',
  payment: 'Оплата',
  fiscalBlock: 'Фискальный блок',
  qrCode: 'QR ОФД',
  footer: 'Подвал / футер',
};

export default function ReceiptCompanyProfilePanel() {
  const { t } = useTranslation();
  const fetchFromServer = useTenantDisplayStore((s) => s.fetchFromServer);
  const saveToServer = useTenantDisplayStore((s) => s.saveToServer);
  const discardDraft = useTenantDisplayStore((s) => s.discardDraft);
  const isDirty = useTenantDisplayStore((s) => s.isDirty);
  const isSaving = useTenantDisplayStore((s) => s.isSaving);
  const isLoading = useTenantDisplayStore((s) => s.isLoading);

  const name = useTenantDisplayStore((s) => s.draft.receiptCompanyName);
  const address = useTenantDisplayStore((s) => s.draft.receiptCompanyAddress);
  const phone = useTenantDisplayStore((s) => s.draft.receiptCompanyPhone);
  const stir = useTenantDisplayStore((s) => s.draft.receiptStir);
  const logo = useTenantDisplayStore((s) => s.draft.receiptLogoDataUrl);
  const logoH = useTenantDisplayStore((s) => s.draft.receiptLogoMaxHeightMm);
  const fields = useTenantDisplayStore((s) => s.draft.receiptFields);
  const styles = useTenantDisplayStore((s) => s.draft.receiptFieldStyles);
  const setName = useTenantDisplayStore((s) => s.setReceiptCompanyName);
  const setAddress = useTenantDisplayStore((s) => s.setReceiptCompanyAddress);
  const setPhone = useTenantDisplayStore((s) => s.setReceiptCompanyPhone);
  const setStir = useTenantDisplayStore((s) => s.setReceiptStir);
  const setLogo = useTenantDisplayStore((s) => s.setReceiptLogo);
  const clearLogo = useTenantDisplayStore((s) => s.clearReceiptLogo);
  const setLogoH = useTenantDisplayStore((s) => s.setReceiptLogoMaxHeightMm);
  const setField = useTenantDisplayStore((s) => s.setReceiptField);
  const setStyle = useTenantDisplayStore((s) => s.setReceiptFieldStyle);
  const resetFields = useTenantDisplayStore((s) => s.resetReceiptFields);

  useEffect(() => {
    fetchFromServer();
  }, [fetchFromServer]);

  const onSave = async () => {
    try {
      await saveToServer();
      toast.success(t('rst.admin.receiptCompanySaved', { defaultValue: 'Настройки чека сохранены' }));
    } catch (e) {
      toast.error(e?.response?.data?.message
        || t('rst.admin.receiptCompanySaveFailed', { defaultValue: 'Не удалось сохранить' }));
    }
  };

  return (
    <section className="rst-receipt-company">
      <div className="rst-receipt-company__head">
        <h2 className="rst-receipt-company__title">
          {t('rst.admin.receiptCompanyTitle', { defaultValue: 'Чек компании (фискальный)' })}
        </h2>
        <p className="rst-receipt-company__hint">
          {t('rst.admin.receiptCompanyHint', {
            defaultValue:
              'Вкл/выкл, выравнивание, размер % и жирность %. Не у всех блоков есть % — у логотипа и QR только положение.',
          })}
        </p>
      </div>

      <ReceiptCompanyLogoField
        dataUrl={logo}
        maxHeightMm={logoH}
        onSet={setLogo}
        onClear={clearLogo}
        onHeight={setLogoH}
        disabled={isLoading}
      />

      <div className="rst-receipt-company__grid">
        <label className="rst-receipt-company__field">
          <span>{t('rst.admin.receiptCompanyName', { defaultValue: 'Название на чеке' })}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
        </label>
        <label className="rst-receipt-company__field">
          <span>{t('rst.admin.receiptCompanyPhone', { defaultValue: 'Телефон' })}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} />
        </label>
        <label className="rst-receipt-company__field rst-receipt-company__field--wide">
          <span>{t('rst.admin.receiptCompanyAddress', { defaultValue: 'Адрес' })}</span>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isLoading}
          />
        </label>
        <label className="rst-receipt-company__field">
          <span>{t('rst.admin.receiptCompanyStir', { defaultValue: 'СТИР / ИНН' })}</span>
          <input value={stir} onChange={(e) => setStir(e.target.value)} disabled={isLoading} />
        </label>
      </div>

      <div className="rst-receipt-company__fields-head">
        <h3>{t('rst.admin.receiptCompanyFields', { defaultValue: 'Блоки на чеке' })}</h3>
        <button type="button" className="rst-receipt-company__link" onClick={resetFields} disabled={isLoading}>
          {t('rst.admin.receiptCompanyResetFields', { defaultValue: 'Включить все' })}
        </button>
      </div>

      <div className="rst-receipt-company__rows">
        {RECEIPT_FIELD_DEFS.map(({ key }) => {
          const on = fields[key] !== false;
          return (
            <div key={key} className={`rst-receipt-company__row${on ? '' : ' is-off'}`}>
              <label className="rst-receipt-company__toggle">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setField(key, e.target.checked)}
                  disabled={isLoading}
                />
                <span>
                  {t(`tenantSettings.receiptFields.${key}`, {
                    defaultValue: FIELD_LABELS[key] || key,
                  })}
                </span>
              </label>
              <ReceiptFieldStyleControls
                fieldKey={key}
                style={styles?.[key]}
                disabled={!on || isLoading}
                onChange={(patch) => setStyle(key, patch)}
              />
            </div>
          );
        })}
      </div>

      <div className="rst-receipt-company__actions">
        {isDirty ? (
          <button type="button" onClick={discardDraft} disabled={isSaving || isLoading}>
            {t('rst.admin.receiptCompanyDiscard', { defaultValue: 'Отменить' })}
          </button>
        ) : null}
        <button
          type="button"
          className="rst-receipt-company__save"
          onClick={onSave}
          disabled={!isDirty || isSaving || isLoading}
        >
          {isSaving
            ? t('rst.admin.receiptCompanySaving', { defaultValue: 'Сохранение…' })
            : t('rst.admin.receiptCompanySave', { defaultValue: 'Сохранить для компании' })}
        </button>
      </div>
    </section>
  );
}
