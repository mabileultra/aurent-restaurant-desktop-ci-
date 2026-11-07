import { BaseCheckbox } from '../../../../components/ui';

export default function FinanceSelectHeader({ selectAllRef, checked, onChange, disabled }) {
  return (
    <th className="finance-table__check">
      <BaseCheckbox
        ref={selectAllRef}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ariaLabel="Select all"
        size={18}
      />
    </th>
  );
}

export function FinanceSelectCell({ checked, onChange, disabled }) {
  return (
    <td className="finance-table__check" onClick={(e) => e.stopPropagation()}>
      <BaseCheckbox
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        size={18}
      />
    </td>
  );
}
