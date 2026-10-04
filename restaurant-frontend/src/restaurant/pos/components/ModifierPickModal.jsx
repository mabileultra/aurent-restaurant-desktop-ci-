import { useMemo, useState } from 'react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatVariantPortionLabel } from '../../shared/utils/formatMenuPortion';
import {
  canToggleModifierOption,
  validateModifierSelection,
} from '../utils/modifierValidation';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';
import '../styles/item-compose-modal.css';

function isSizeGroup(group) {
  return (group.groupKind || 'STANDARD') === 'SIZE';
}

/**
 * Waiter compose: portion (1 / 1.5) + optional add-ons + line note — one dialog.
 */
export default function ModifierPickModal({
  item,
  variants = null,
  onSelectVariant,
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
  const variantList = variants?.length > 1 ? variants : null;

  const sizeGroups = useMemo(
    () => (groups ?? []).filter((g) => isSizeGroup(g)),
    [groups],
  );
  const addonGroups = useMemo(
    () => (groups ?? []).filter((g) => !isSizeGroup(g)),
    [groups],
  );

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

  const showAddons = addonGroups.length > 0;
  const showSizeMods = sizeGroups.length > 0;
  const hasAnyMods = showAddons || showSizeMods;

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card rst-item-compose">
        <h2 className="rst-modal__title">{item.name}</h2>
        <p className="rst-modal__text">
          {variantList
            ? t('rst.order.composeHintWithPortion')
            : hasAnyMods
              ? t('rst.order.composeHintAddons')
              : t('rst.order.addNoteHint')}
        </p>

        {variantList ? (
          <div className="rst-item-compose__section">
            <div className="rst-item-compose__addons-head">
              <strong>{t('rst.order.portionSection')}</strong>
            </div>
            <div className="rst-item-compose__options rst-item-compose__options--portion">
              {variantList.map((variant, index) => {
                const active = variant.id === item.id;
                const portion = formatVariantPortionLabel(variant, {
                  index,
                  count: variantList.length,
                  t,
                });
                return (
                  <button
                    key={variant.id}
                    type="button"
                    className={`rst-item-compose__option rst-item-compose__option--size${active ? ' is-active' : ''}`}
                    onClick={() => {
                      if (!active) {
                        setError('');
                        onSelectVariant?.(variant);
                      }
                    }}
                  >
                    <span className="rst-item-compose__portion-label">{portion}</span>
                    <em className="rst-item-compose__price">{fmtMoneyCompact(variant.price)}</em>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {showSizeMods ? (
          <div className="rst-item-compose__section">
            <div className="rst-item-compose__addons-head">
              <strong>{t('rst.order.sizeGroupTitle')}</strong>
            </div>
            {sizeGroups.map((group) => (
              <div
                key={group.id}
                className="rst-item-compose__group rst-item-compose__group--size"
              >
                <p className="rst-modal__text mb-1">{t('rst.order.sizePickHint')}</p>
                <div className="rst-item-compose__options">
                  {(group.options ?? []).map((option) => {
                    const checked = selectedIds.includes(option.id);
                    const disabled = !checked && !canToggleModifierOption(group, option.id, selectedIds);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`rst-item-compose__option rst-item-compose__option--size${checked ? ' is-active' : ''}`}
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
          </div>
        ) : null}

        {showAddons ? (
          <div className="rst-item-compose__section">
            <div className="rst-item-compose__addons-head">
              <strong>{t('rst.order.addonsSection')}</strong>
            </div>
            <p className="rst-modal__text mb-1">{t('rst.order.addonsOptionalHint')}</p>
            {addonGroups.map((group) => (
              <div key={group.id} className="rst-item-compose__group">
                <strong>
                  {group.name}
                  {group.availableForAll ? (
                    <em className="rst-item-compose__scope">{t('rst.order.addonStoreWide')}</em>
                  ) : null}
                </strong>
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
          </div>
        ) : null}

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
