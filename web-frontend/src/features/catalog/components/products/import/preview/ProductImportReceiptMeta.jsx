import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BaseSelect } from '../../../../../../components/ui';
import { supplierApi } from '../../../../../../api';
import { inputCls } from '../../../../../../utils/productImportUtils';

/**
 * Мета прихода при импорте AS_RECEIPT: поставщик, оплата (наличка/долг), комментарий.
 */
export default function ProductImportReceiptMeta({
  t,
  supplierId,
  setSupplierId,
  paymentType,
  setPaymentType,
  receiptNotes,
  setReceiptNotes,
}) {
  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });
  const supplierList = suppliersQuery.data?.content ?? [];

  return (
    <div className="product-import-receipt-meta">
      <p className="product-import-receipt-meta__title">{t('products.import.receiptMetaTitle')}</p>
      <div className="product-import-receipt-meta__grid">
        <div className="space-y-1.5">
          <BaseSelect
            label={t('stockReports.colSupplier')}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            placeholder="—"
            options={[
              { value: '', label: '—' },
              ...supplierList.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
          <Link
            to="/suppliers"
            className="text-xs font-semibold text-emerald-700 underline dark:text-emerald-400"
          >
            {t('finance.expenses.addSupplier')}
          </Link>
        </div>
        <BaseSelect
          label={t('stockReports.paymentType')}
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          options={[
            { value: 'CASH', label: t('stockReports.paymentCash') },
            { value: 'CREDIT', label: t('stockReports.paymentCredit') },
          ]}
        />
        <div className="product-import-receipt-meta__notes sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('stockReports.writeOffNotes')}
          </label>
          <input
            type="text"
            value={receiptNotes}
            onChange={(e) => setReceiptNotes(e.target.value)}
            placeholder={t('products.import.receiptNotesPh')}
            className={inputCls}
          />
        </div>
      </div>
      {paymentType === 'CREDIT' ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          {t('products.import.receiptCreditHint')}
        </p>
      ) : null}
    </div>
  );
}
