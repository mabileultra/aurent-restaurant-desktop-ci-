import { BaseInput } from '../../../components/ui';
import {
  PORTION_AMOUNT_PRESETS,
  formatPortionAmountDisplay,
  parsePortionAmountInput,
  sanitizePortionAmountTyping,
} from '../../shared/utils/portionAmountInput';

/** Portion size: presets (0.5 / 0.7 / 1 / 1.5) + free number / «полтора». */
export default function PortionAmountField({
  label,
  value,
  unit = 'PORTION',
  onChange,
  t,
}) {
  const showPresets = !unit || unit === 'PORTION';
  const current = formatPortionAmountDisplay(value) || String(value || '');

  return (
    <div className="rst-portion-amount">
      <BaseInput
        label={label}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(sanitizePortionAmountTyping(e.target.value))}
        onBlur={() => {
          const parsed = parsePortionAmountInput(value);
          if (parsed == null) {
            if (String(value || '').trim() === '') return;
            onChange('');
            return;
          }
          onChange(formatPortionAmountDisplay(parsed));
        }}
        placeholder={t('rst.admin.portionAmountHint')}
      />
      {showPresets ? (
        <div className="rst-portion-amount__presets" role="group" aria-label={label}>
          {PORTION_AMOUNT_PRESETS.map((preset) => {
            const active = current === preset;
            const caption = preset === '1.5'
              ? t('rst.admin.portionPresetHalf')
              : preset;
            return (
              <button
                key={preset}
                type="button"
                className={`rst-portion-amount__chip${active ? ' is-active' : ''}`}
                onClick={() => onChange(preset)}
              >
                {caption}
              </button>
            );
          })}
        </div>
      ) : null}
      <p className="rst-admin-field__hint mb-0">{t('rst.admin.portionAmountHelp')}</p>
    </div>
  );
}
