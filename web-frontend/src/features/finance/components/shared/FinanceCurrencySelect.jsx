import { BaseSelect } from '../../../../components/ui';
import { buildFinanceCurrencyOptions } from '../../utils/shared/financeCurrencies';

export default function FinanceCurrencySelect({ t, value, onChange, label }) {
  return (
    <BaseSelect
      label={label ?? t('finance.detail.currency')}
      value={value}
      onChange={onChange}
      options={buildFinanceCurrencyOptions(t)}
    />
  );
}
