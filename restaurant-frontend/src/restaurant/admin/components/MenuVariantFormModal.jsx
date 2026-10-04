import { BaseButton, BaseInput, BaseSelect } from '../../../components/ui';
import RstModal from '../../shared/components/RstModal';
import PortionAmountField from './PortionAmountField';

export default function MenuVariantFormModal({ p }) {
  if (!p.variantSource) return null;
  const f = p.variantForm;

  return (
    <RstModal
      open
      title={p.t('rst.admin.addVariantTitle', { name: p.variantSource.name })}
      onClose={p.closeVariantForm}
      onSubmit={() => p.createVariantMutation.mutate()}
      isPending={p.createVariantMutation.isPending}
      asForm
      size="md"
      cancelLabel={p.t('common.cancel')}
      submitLabel={p.t('rst.admin.addVariant')}
    >
      <p className="rst-admin-form__note">{p.t('rst.admin.addVariantHint')}</p>
      <div className="rst-modal-form__grid">
        <BaseInput
          label={p.t('rst.admin.price')}
          type="number"
          min={0}
          step="0.01"
          required
          value={f.price}
          onChange={(e) => p.setVariantForm({ ...f, price: e.target.value })}
        />
        <PortionAmountField
          label={p.t('rst.admin.portionAmount')}
          value={f.portionAmount}
          unit={f.portionUnit}
          onChange={(portionAmount) => p.setVariantForm({ ...f, portionAmount })}
          t={p.t}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={p.t('rst.admin.portionUnit')}
          value={f.portionUnit || 'PORTION'}
          onChange={(e) => p.setVariantForm({ ...f, portionUnit: e.target.value })}
          options={[
            { value: 'PORTION', label: p.t('rst.admin.portionUnitPortion') },
            { value: 'KG', label: p.t('rst.admin.portionUnitKg', { defaultValue: 'Килограммы (весовой)' }) },
            { value: 'G', label: p.t('rst.admin.portionUnitG') },
            { value: 'PCS', label: p.t('rst.admin.portionUnitPcs') },
          ]}
        />
        <BaseInput
          label={p.t('rst.admin.portionLabel')}
          value={f.portionLabel}
          onChange={(e) => p.setVariantForm({ ...f, portionLabel: e.target.value })}
          placeholder={p.t('rst.admin.portionLabelHint')}
        />
        <BaseInput
          label={p.t('rst.admin.sku')}
          value={f.sku}
          onChange={(e) => p.setVariantForm({ ...f, sku: e.target.value })}
        />
      </div>
    </RstModal>
  );
}
