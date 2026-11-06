import { BaseButton } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';
import '../styles/floor-phase2.css';

export default function TransferTableModal({
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
        <h2 className="rst-modal__title">{t('rst.floor.transferTitle')}</h2>
        <p className="rst-modal__text">
          {t('rst.floor.transferHint', { code: sourceTable.code })}
        </p>
        {tables.length === 0 ? (
          <p className="rst-modal__text">{t('rst.floor.noFreeTables')}</p>
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
                <em>{t('rst.floor.seats', { count: table.seatCount })}</em>
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
            {t('rst.floor.transferConfirm')}
          </BaseButton>
        </div>
      </div>
    </RstOverlay>
  );
}
