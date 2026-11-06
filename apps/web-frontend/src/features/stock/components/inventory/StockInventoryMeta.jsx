import { BaseSelect } from '../../../../components/ui';
import AdminDocumentMetaField from '../../../../components/admin-document/AdminDocumentMetaField';

export default function StockInventoryMeta({
  t,
  storeId,
  onStoreChange,
  stores,
  needsStorePick,
  notes,
  onNotesChange,
}) {
  return (
    <section className="admin-doc-meta">
      <AdminDocumentMetaField label={t('stockReports.inventoryStoreLabel')} required={needsStorePick}>
        <BaseSelect
          value={storeId}
          onChange={onStoreChange}
          placeholder={needsStorePick ? t('stockModal.pickStore') : '—'}
          options={[
            { value: '', label: needsStorePick ? t('stockModal.pickStore') : '—' },
            ...stores.map((store) => ({ value: String(store.id), label: store.name })),
          ]}
        />
      </AdminDocumentMetaField>
      <AdminDocumentMetaField label={t('stockReports.writeOffNotes')}>
        <input
          className="admin-doc-meta__notes"
          value={notes}
          onChange={onNotesChange}
          placeholder={t('stockReports.inventoryCommentPlaceholder')}
        />
      </AdminDocumentMetaField>
    </section>
  );
}
