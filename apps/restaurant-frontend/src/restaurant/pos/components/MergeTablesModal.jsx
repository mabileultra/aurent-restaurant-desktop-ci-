import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';
import '../styles/floor-phase2.css';

export default function MergeTablesModal({
  open,
  sourceTable,
  tables,
  selectedId,
  onSelect,
  onClose,
  onConfirm,
  isPending,
  t,
}) {
  if (!open || !sourceTable) return null;

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card">
        <h2 className="rst-modal__title">{t('rst.floor.mergeTitle')}</h2>
        <p className="rst-modal__text">
          {t('rst.floor.mergeHint', { code: sourceTable.code })}
        </p>
        {tables.length === 0 ? (
          <p className="rst-modal__text">{t('rst.floor.noMergeTables')}</p>
        ) : (
          <div className="rst-table-pick">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                className={`rst-table-pick__item${selectedId === table.id ? ' is-active' : ''}`}
                onClick={() => onSelect(table.id)}
              >
                {table.code}
                <em>{fmtMoneyCompact(table.activeOrder?.subtotal ?? 0)}</em>
              </button>
            ))}
          </div>
        )}
        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton
            type="button"
            disabled={!selectedId || isPending}
            onClick={onConfirm}
          >
            {t('rst.floor.mergeConfirm')}
          </BaseButton>
        </div>
      </div>
    </RstOverlay>
  );
}
