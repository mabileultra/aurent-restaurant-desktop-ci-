import PharmacyStockLayout from '../../pharmacy-stock/components/PharmacyStockLayout';
import { BaseButton, BaseSelect } from '../../../components/ui';
import StockTransferLinesEditor from '../components/document-create/StockTransferLinesEditor';
import { useStockTransferCreatePage } from '../hooks/useStockTransferCreatePage';
import '../styles/pharmacy-transfer.css';

export default function StockTransferCreatePage() {
  const m = useStockTransferCreatePage();
  const { t } = m;

  return (
    <PharmacyStockLayout
      backTo="/reports/stock/transfers"
      backLabel={t('stockReports.transfersTitle')}
      backIconOnly
      title={t('stockReports.transferCreateTitle')}
      subtitle={t('stockReports.transferModesHint')}
      actions={(
        <BaseButton disabled={m.isPending || !m.canSubmit} onClick={m.submit}>
          {m.mode === 'receipt' ? t('stockReports.transferSubmitReceipt') : t('stockReports.transferSubmit')}
        </BaseButton>
      )}
    >
      <div className="pharmacy-transfer__modes" role="tablist" aria-label={t('stockReports.transferModesHint')}>
        <button
          type="button"
          role="tab"
          aria-selected={m.mode === 'receipt'}
          className={`pharmacy-transfer__mode${m.mode === 'receipt' ? ' is-active' : ''}`}
          onClick={() => m.setMode('receipt')}
        >
          {t('stockReports.transferModeReceipt')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={m.mode === 'lines'}
          className={`pharmacy-transfer__mode${m.mode === 'lines' ? ' is-active' : ''}`}
          onClick={() => m.setMode('lines')}
        >
          {t('stockReports.transferModeLines')}
        </button>
      </div>

      {m.mode === 'receipt' ? (
        <section className="pharmacy-transfer__card">
          <label className="pharmacy-transfer__field">
            <span className="pharmacy-transfer__label">{t('stockReports.transferPickReceipt')}</span>
            <BaseSelect
              value={m.receiptId}
              onChange={(e) => {
                m.setReceiptId(e.target.value);
                m.setToStoreId('');
              }}
              placeholder={m.receiptsLoading ? t('common.loading') : t('stockReports.transferPickReceipt')}
              options={[
                { value: '', label: t('stockReports.transferPickReceipt') },
                ...m.receipts.map((row) => ({
                  value: String(row.id),
                  label: [
                    row.receiptNumber,
                    row.storeName || m.stores.find((s) => Number(s.id) === Number(row.storeId))?.name,
                    row.supplierName,
                    row.totalQuantity != null ? `qty ${row.totalQuantity}` : null,
                  ].filter(Boolean).join(' · '),
                })),
              ]}
            />
          </label>

          {m.selectedReceipt ? (
            <div className="pharmacy-transfer__summary" aria-live="polite">
              <div>
                <span className="pharmacy-transfer__label">{t('stockReports.fromStore')}</span>
                <p className="pharmacy-transfer__value">{m.selectedReceipt.storeName || '—'}</p>
              </div>
              <div>
                <span className="pharmacy-transfer__label">{t('stockReports.transferReceiptLines')}</span>
                <p className="pharmacy-transfer__value">
                  {t('stockReports.transferReceiptQty', { qty: m.selectedReceipt.totalQuantity ?? 0 })}
                </p>
              </div>
            </div>
          ) : null}

          <label className="pharmacy-transfer__field">
            <span className="pharmacy-transfer__label">{t('stockReports.toStore')}</span>
            <BaseSelect
              value={m.toStoreId}
              onChange={(e) => m.setToStoreId(e.target.value)}
              disabled={!m.selectedReceipt}
              placeholder={t('stockReports.toStore')}
              options={[
                { value: '', label: t('stockReports.toStore') },
                ...m.receiptToStoreOptions.map((store) => ({
                  value: String(store.id),
                  label: store.name,
                })),
              ]}
            />
          </label>

          <NotesField t={t} notes={m.notes} setNotes={m.setNotes} />
        </section>
      ) : (
        <>
          <section className="pharmacy-transfer__card pharmacy-transfer__card--stores">
            <label className="pharmacy-transfer__field">
              <span className="pharmacy-transfer__label">{t('stockReports.fromStore')}</span>
              <BaseSelect
                value={m.fromStoreId}
                onChange={(e) => {
                  m.setFromStoreId(e.target.value);
                  if (String(m.toStoreId) === String(e.target.value)) m.setToStoreId('');
                }}
                placeholder={t('stockReports.fromStore')}
                options={[
                  { value: '', label: t('stockReports.fromStore') },
                  ...m.stores.map((store) => ({ value: String(store.id), label: store.name })),
                ]}
              />
            </label>
            <label className="pharmacy-transfer__field">
              <span className="pharmacy-transfer__label">{t('stockReports.toStore')}</span>
              <BaseSelect
                value={m.toStoreId}
                onChange={(e) => m.setToStoreId(e.target.value)}
                disabled={!m.fromStoreId}
                placeholder={t('stockReports.toStore')}
                options={[
                  { value: '', label: t('stockReports.toStore') },
                  ...m.linesToStoreOptions.map((store) => ({
                    value: String(store.id),
                    label: store.name,
                  })),
                ]}
              />
            </label>
            <NotesField t={t} notes={m.notes} setNotes={m.setNotes} />
          </section>

          <StockTransferLinesEditor
            t={t}
            lines={m.lines}
            fromStoreId={m.fromStoreId}
            updateLine={m.updateLine}
            addLine={m.addLine}
            removeLine={m.removeLine}
          />
        </>
      )}

      <p className="pharmacy-transfer__note">{t('stockReports.transferNote')}</p>
    </PharmacyStockLayout>
  );
}

function NotesField({ t, notes, setNotes }) {
  return (
    <label className="pharmacy-transfer__field">
      <span className="pharmacy-transfer__label">{t('stockReports.writeOffNotes')}</span>
      <input
        className="pharmacy-transfer__notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('stockReports.transferNotesPlaceholder')}
      />
    </label>
  );
}
