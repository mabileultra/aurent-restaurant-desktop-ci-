import { useMemo, useState } from 'react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import {
  canToggleModifierOption,
  validateModifierSelection,
} from '../utils/modifierValidation';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';
import '../styles/item-compose-modal.css';

/**
 * Compose dish before add: modifiers (optional) + line note.
 */
export default function ModifierPickModal({
  item,
  groups = [],
  selectedIds,
  onToggle,
  note,
  onNoteChange,
  onClose,
  onConfirm,
  isPending = false,
  t,
}) {
  const [error, setError] = useState('');
  const hasGroups = (groups ?? []).length > 0;

  const validation = useMemo(
    () => validateModifierSelection(groups, selectedIds),
    [groups, selectedIds],
  );

  if (!item) return null;

  const handleConfirm = () => {
    if (!validation.ok) {
      const key = validation.reason === 'max' ? 'rst.order.modMax' : 'rst.order.modMin';
      setError(t(key, {
        group: validation.group?.name ?? '',
        min: validation.min,
        max: validation.max,
        count: validation.count,
      }));
      return;
    }
    setError('');
    onConfirm();
  };

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card rst-item-compose">
        <h2 className="rst-modal__title">{item.name}</h2>
        <p className="rst-modal__text">
          {hasGroups ? t('rst.order.pickModifiers') : t('rst.order.addNoteHint')}
        </p>

        {(groups ?? []).map((group) => (
          <div key={group.id} className="rst-item-compose__group">
            <strong>{group.name}</strong>
            <p className="rst-modal__text mb-1">
              {t('rst.admin.selectRange', { min: group.minSelect, max: group.maxSelect })}
            </p>
            <div className="rst-item-compose__options">
              {(group.options ?? []).map((option) => {
                const checked = selectedIds.includes(option.id);
                const disabled = !checked && !canToggleModifierOption(group, option.id, selectedIds);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`rst-item-compose__option${checked ? ' is-active' : ''}`}
                    disabled={disabled}
                    onClick={() => {
                      setError('');
                      onToggle(option.id);
                    }}
                  >
                    <span>{option.name}</span>
                    <em>{fmtMoneyCompact(option.priceDelta)}</em>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <label className="rst-item-compose__note">
          <span>{t('rst.order.lineNote')}</span>
          <textarea
            value={note ?? ''}
            onChange={(e) => onNoteChange?.(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder={t('rst.order.lineNotePh')}
          />
        </label>

        {error ? <p className="rst-item-compose__error">{error}</p> : null}

        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={handleConfirm} disabled={isPending}>
            {t('rst.order.add')}
          </BaseButton>
        </div>
      </div>
    </RstOverlay>
  );
}
