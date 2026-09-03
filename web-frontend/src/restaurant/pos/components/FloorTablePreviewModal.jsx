import { BaseButton } from '../../../components/ui';
import '../../shared/styles/rst-modal.css';

export default function FloorTablePreviewModal({ open, table, onClose, t }) {
  if (!open || !table) return null;

  return (
    <div className="rst-modal" role="dialog" aria-modal="true">
      <div className="rst-modal__card">
        <h2 className="rst-modal__title">
          {t('rst.floor.tableTitle', { code: table.code })}
        </h2>
        <p className="rst-modal__text">
          {t('rst.floor.tableMeta', {
            seats: table.seatCount,
            status: t(`rst.status.${table.status ?? 'FREE'}`),
          })}
        </p>
        <p className="rst-modal__text">{t('rst.floor.orderNextStage')}</p>
        <div className="rst-modal__actions">
          <BaseButton type="button" onClick={onClose}>
            {t('common.close')}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
