import AutoFitText from '../AutoFitText';
import { formatKeypadAmount } from '../NumericKeypad';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export function PosPayCashReceivedValue({ tendered }) {
  return (
    <AutoFitText
      text={formatKeypadAmount(tendered)}
      className="pos-pay-cash__received-value"
      minRem={0.875}
      maxRem={2.5}
    />
  );
}

export function PosPayCashChangeValue({ changeDue, ready = false }) {
  return (
    <AutoFitText
      as="strong"
      text={fmt(changeDue)}
      className="pos-pay-cash__change-value"
      innerClassName={ready ? 'pos-pay-cash__change-value--ready' : ''}
      minRem={0.8125}
      maxRem={ready ? 2.125 : 1.125}
    />
  );
}
