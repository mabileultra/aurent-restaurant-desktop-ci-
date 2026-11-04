import { useEffect, useMemo, useState } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { BaseButton, BaseInput } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
import {
  isWeightSoldMenuItem,
  menuAmountFromGrams,
  menuGramsFromAmount,
  menuQtyFromGrams,
  menuRefGrams,
  menuWeightNote,
  menuWeightPresets,
} from '../utils/menuWeightSale';
import '../../shared/styles/rst-modal.css';
import '../styles/item-compose-modal.css';
import '../styles/menu-weight-pick.css';

function presetLabel(grams, t) {
  if (grams >= 1000 && grams % 1000 === 0) {
    return t('rst.order.weightPresetKg', { kg: grams / 1000, defaultValue: '{{kg}} кг' });
  }
  return t('rst.order.weightPresetG', { g: grams, defaultValue: '{{g}} г' });
}

/** Waiter picks grams / money for a KG-priced dish. */
export default function MenuWeightPickModal({ item, onClose, onConfirm, isPending, t }) {
  const refGrams = menuRefGrams(item);
  const [grams, setGrams] = useState('');
  const [amount, setAmount] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  useEffect(() => {
    setGrams('');
    setAmount('');
    setActivePreset(null);
  }, [item?.id]);

  const gramsNum = Number(grams);
  const qty = useMemo(
    () => (item && gramsNum > 0 ? menuQtyFromGrams(item, gramsNum) : null),
    [item, gramsNum],
  );
  const canSubmit = isWeightSoldMenuItem(item) && qty != null && qty >= 0.001 && !isPending;

  const applyGrams = (nextGrams, preset = null) => {
    const g = Math.max(0, Math.round(Number(nextGrams) || 0));
    setGrams(g ? String(g) : '');
    setActivePreset(preset);
    if (!item || !g) {
      setAmount('');
      return;
    }
    const money = menuAmountFromGrams(item, g);
    setAmount(money != null ? String(money) : '');
  };

  const applyAmount = (nextAmount) => {
    setAmount(nextAmount);
    setActivePreset(null);
    if (!item) return;
    const g = menuGramsFromAmount(item, nextAmount);
    setGrams(g != null ? String(g) : '');
  };

  if (!item || !isWeightSoldMenuItem(item)) return null;

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card rst-item-compose rst-weight-pick">
        <h2 className="rst-modal__title">{item.name}</h2>
        <p className="rst-modal__text">
          {t('rst.order.weightPickHint', {
            weight: menuWeightNote(refGrams),
            price: fmtMoneyCompact(item.price),
            defaultValue: 'Цена {{price}} за {{weight}}. Выберите вес или введите сумму / граммы.',
          })}
        </p>

        <div className="rst-item-compose__group rst-item-compose__group--size">
          <div className="rst-item-compose__options rst-weight-pick__presets">
            {menuWeightPresets().map((g) => (
              <button
                key={g}
                type="button"
                className={`rst-item-compose__option rst-item-compose__option--size${activePreset === g ? ' is-selected' : ''}`}
                onClick={() => applyGrams(g, g)}
              >
                <span className="rst-item-compose__portion-label">{presetLabel(g, t)}</span>
                <em>{fmtMoneyCompact(menuAmountFromGrams(item, g) || 0)}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="rst-weight-pick__fields">
          <BaseInput
            label={t('rst.order.weightGrams', { defaultValue: 'Граммы' })}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={grams}
            onChange={(e) => applyGrams(e.target.value)}
            placeholder="250"
          />
          <BaseInput
            label={t('rst.order.weightAmount', { defaultValue: 'Сумма' })}
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => applyAmount(e.target.value)}
            placeholder="0"
          />
        </div>

        {qty != null ? (
          <p className="rst-weight-pick__total">
            {menuWeightNote(gramsNum)}
            {' · '}
            <strong>{fmtMoneyCompact(menuAmountFromGrams(item, gramsNum) || 0)}</strong>
          </p>
        ) : null}

        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm({
              menuItem: item,
              quantity: qty,
              note: menuWeightNote(gramsNum),
            })}
          >
            {t('rst.order.addToCheck', { defaultValue: 'В чек' })}
          </BaseButton>
        </div>
      </div>
    </RstOverlay>
  );
}
