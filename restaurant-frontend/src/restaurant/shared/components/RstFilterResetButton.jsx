import { BaseButton } from '../../../components/ui';

/** Shared reset control for rst-admin-filters rows. */
export default function RstFilterResetButton({ t, onClick, disabled, children, label }) {
  return (
    <BaseButton
      type="button"
      variant="secondary"
      size="md"
      className="rst-admin-filters__reset"
      onClick={onClick}
      disabled={disabled}
    >
      {children ?? label ?? t?.('rst.admin.filterReset') ?? t?.('common.reset')}
    </BaseButton>
  );
}
