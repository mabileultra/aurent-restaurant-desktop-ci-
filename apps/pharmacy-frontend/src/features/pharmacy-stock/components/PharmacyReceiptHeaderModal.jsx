import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../components/ui';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import SupplierModal from '../../catalog/components/suppliers/SupplierModal';
import PharmacyReceiptPaymentFields from './PharmacyReceiptPaymentFields';
import { buildPaymentPayload, paymentFormFromReceipt } from '../utils/pharmacyReceiptPayments';
import {
  emptyHeaderForm,
  normalizeHeaderInitial,
  todayInputValue,
} from '../utils/pharmacyReceiptHeaderForm';
import '../styles/pharmacy-stock.css';

/**
 * Модалка шапки поступления «Поступление | Новый» (как в Oson).
 * Не путать с модалкой строки товара (цены / серия / срок).
 */
export default function PharmacyReceiptHeaderModal({
  open,
  onClose,
  t,
  suppliers,
  initial,
  totalCost,
  saving,
  onSubmit,
  storeLocked = false,
}) {
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();
  const [form, setForm] = useState(() => emptyHeaderForm());
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [localSuppliers, setLocalSuppliers] = useState([]);

  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (!open) return;
    setSupplierModalOpen(false);
    setLocalSuppliers([]);
    setForm({
      ...emptyHeaderForm(),
      ...normalizeHeaderInitial(initial),
      storeId: initial?.storeId
        ? String(initial.storeId)
        : onlyStore
          ? String(onlyStore.id)
          : '',
      documentDate: initial?.documentDate || todayInputValue(),
      defaultMarkupPercent: initial?.defaultMarkupPercent != null
        ? String(initial.defaultMarkupPercent)
        : '18',
      receiptType: initial?.receiptType || 'RECEIPT',
      payment: paymentFormFromReceipt(initial),
    });
  }, [open, initial, onlyStore]);

  const allSuppliers = useMemo(() => {
    const map = new Map();
    [...(suppliers || []), ...localSuppliers].forEach((s) => {
      if (s?.id != null) map.set(String(s.id), s);
    });
    return [...map.values()];
  }, [suppliers, localSuppliers]);

  const storeOptions = useMemo(
    () => [
      { value: '', label: needsStorePick ? t('stockModal.pickStore') : '—' },
      ...stores.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [stores, needsStorePick, t],
  );

  const supplierOptions = useMemo(
    () => [
      { value: '', label: '—' },
      ...allSuppliers.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [allSuppliers],
  );

  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const storeId = resolveStoreId(form.storeId);
    if (!storeId) return;
    onSubmit({
      supplierId: form.supplierId || undefined,
      storeId,
      documentDate: form.documentDate || undefined,
      receiptType: form.receiptType || 'RECEIPT',
      defaultMarkupPercent: form.defaultMarkupPercent !== ''
        ? Number(form.defaultMarkupPercent)
        : undefined,
      invoiceNumber: form.invoiceNumber.trim() || undefined,
      invoiceDate: form.invoiceDate || undefined,
      contractNumber: form.contractNumber.trim() || undefined,
      financialDiscount: form.financialDiscount !== ''
        ? Number(form.financialDiscount)
        : undefined,
      ...buildPaymentPayload(form.payment),
      notes: form.notes.trim() || undefined,
    });
  };

  const title = isEdit
    ? t('pharmacyStock.headerModalEditTitle')
    : t('pharmacyStock.headerModalTitle');

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title={title}
        size="md"
        className="pharmacy-stock pharm-header-modal max-w-[36rem]"
        bodyClassName="!pt-3"
        footer={(
          <div className="pharmacy-stock flex w-full justify-center">
            <BaseButton
              className="pharm-product-modal__btn-primary min-w-[180px]"
              onClick={handleSubmit}
              disabled={saving || !resolveStoreId(form.storeId)}
            >
              {saving ? t('common.saving') : t('common.save')}
            </BaseButton>
          </div>
        )}
      >
        <div className="space-y-3">
          <div className="pharm-line-modal__row pharm-line-modal__row--2">
            <label className="pharm-line-modal__field">
              <span className="pharm-line-modal__label">{t('pharmacyStock.receiptType')}</span>
              <select
                className="pharm-line-modal__input"
                value={form.receiptType}
                onChange={(e) => patch('receiptType', e.target.value)}
              >
                <option value="RECEIPT">{t('pharmacyStock.receiptTypeReceipt')}</option>
                <option value="OPENING">{t('pharmacyStock.receiptTypeOpening')}</option>
              </select>
              {form.receiptType === 'OPENING' ? (
                <span className="pharm-line-modal__hint">{t('pharmacyStock.openingStockHint')}</span>
              ) : null}
            </label>
            <label className="pharm-line-modal__field">
              <span className="pharm-line-modal__label">{t('pharmacyStock.documentDate')}</span>
              <input
                type="date"
                className="pharm-line-modal__input"
                value={form.documentDate}
                onChange={(e) => patch('documentDate', e.target.value)}
              />
            </label>
          </div>

          <div className="pharm-line-modal__row pharm-line-modal__row--2">
            <label className="pharm-line-modal__field">
              <span className="pharm-line-modal__label">{t('pharmacyStock.markup')}</span>
              <input
                type="number"
                className="pharm-line-modal__input"
                value={form.defaultMarkupPercent}
                onChange={(e) => patch('defaultMarkupPercent', e.target.value)}
              />
            </label>
            <label className="pharm-line-modal__field">
              <span className="pharm-line-modal__label">{t('stockReports.colStore')}</span>
              <select
                className="pharm-line-modal__input"
                value={form.storeId}
                disabled={storeLocked}
                onChange={(e) => patch('storeId', e.target.value)}
              >
                {storeOptions.map((o) => (
                  <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <PharmacyReceiptPaymentFields
            t={t}
            form={form.payment}
            onChange={(payment) => patch('payment', payment)}
            totalCost={totalCost ?? initial?.totalCost}
          />

          <div>
            <h3 className="pharm-line-modal__section-title" style={{ marginTop: 4 }}>
              {t('pharmacyStock.invoiceSection')}
            </h3>

            <div className="pharm-line-modal__field mb-3">
              <span className="pharm-line-modal__label">{t('stockReports.colSupplier')}</span>
              <div className="pharm-product-modal__inline">
                <select
                  className="pharm-line-modal__input"
                  value={form.supplierId}
                  onChange={(e) => patch('supplierId', e.target.value)}
                >
                  {supplierOptions.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="pharm-product-modal__icon-btn"
                  title={t('pharmacyStock.addSupplier')}
                  aria-label={t('pharmacyStock.addSupplier')}
                  onClick={() => setSupplierModalOpen(true)}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="pharm-line-modal__row pharm-line-modal__row--2">
              <label className="pharm-line-modal__field">
                <span className="pharm-line-modal__label">{t('pharmacyStock.invoiceNumber')}</span>
                <input
                  className="pharm-line-modal__input"
                  value={form.invoiceNumber}
                  onChange={(e) => patch('invoiceNumber', e.target.value)}
                />
              </label>
              <label className="pharm-line-modal__field">
                <span className="pharm-line-modal__label">{t('pharmacyStock.invoiceDate')}</span>
                <input
                  type="date"
                  className="pharm-line-modal__input"
                  value={form.invoiceDate}
                  onChange={(e) => patch('invoiceDate', e.target.value)}
                />
              </label>
            </div>

            <div className="pharm-line-modal__row pharm-line-modal__row--2">
              <label className="pharm-line-modal__field">
                <span className="pharm-line-modal__label">{t('pharmacyStock.contractNumber')}</span>
                <input
                  className="pharm-line-modal__input"
                  value={form.contractNumber}
                  onChange={(e) => patch('contractNumber', e.target.value)}
                />
              </label>
              <label className="pharm-line-modal__field">
                <span className="pharm-line-modal__label">{t('pharmacyStock.financialDiscount')}</span>
                <input
                  type="number"
                  className="pharm-line-modal__input"
                  value={form.financialDiscount}
                  onChange={(e) => patch('financialDiscount', e.target.value)}
                />
              </label>
            </div>

            <label className="pharm-line-modal__field">
              <span className="pharm-line-modal__label">{t('pharmacyStock.notes')}</span>
              <input
                className="pharm-line-modal__input"
                value={form.notes}
                onChange={(e) => patch('notes', e.target.value)}
              />
            </label>
          </div>
        </div>
      </BaseModal>

      <SupplierModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onCreated={(created) => {
          if (!created?.id) return;
          setLocalSuppliers((prev) => [...prev, created]);
          patch('supplierId', String(created.id));
        }}
      />
    </>
  );
}
