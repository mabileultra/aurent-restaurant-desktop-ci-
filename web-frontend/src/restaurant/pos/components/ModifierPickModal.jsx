import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../../shared/styles/rst-modal.css';

export default function ModifierPickModal({ item, groups, selectedIds, onToggle, onClose, onConfirm, t }) {
  if (!item) return null;

  return (
    <div className="rst-modal" role="dialog" aria-modal="true">
      <div className="rst-modal__card">
        <h2 className="rst-modal__title">{item.name}</h2>
        <p className="rst-modal__text">{t('rst.order.pickModifiers')}</p>
        {(groups ?? []).map((group) => (
          <div key={group.id} className="mb-3">
            <strong>{group.name}</strong>
            <p className="rst-modal__text mb-1">
              {t('rst.admin.selectRange', { min: group.minSelect, max: group.maxSelect })}
            </p>
            {(group.options ?? []).map((option) => (
              <label key={option.id} className="d-flex gap-2 align-items-center mt-1">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => onToggle(option.id)}
                />
                <span>{option.name}</span>
                <span>{fmtMoneyCompact(option.priceDelta)}</span>
              </label>
            ))}
          </div>
        ))}
        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton type="button" onClick={onConfirm}>{t('rst.order.add')}</BaseButton>
        </div>
      </div>
    </div>
  );
}
