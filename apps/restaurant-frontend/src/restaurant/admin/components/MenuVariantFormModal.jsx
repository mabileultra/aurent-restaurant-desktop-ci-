import { BaseButton, BaseInput, BaseSelect } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatMenuPortion } from '../../shared/utils/formatMenuPortion';
import RstModal from '../../shared/components/RstModal';
import PortionAmountField from './PortionAmountField';

export default function MenuVariantFormModal({ p }) {
  if (!p.variantSource) return null;
  const f = p.variantForm;
  const editing = Boolean(p.editingVariantId);
  const family = p.variantFamily ?? [];
  const pending = p.saveVariantMutation.isPending || p.deleteVariantMutation.isPending;

  return (
    <RstModal
      open
      title={editing
        ? p.t('rst.admin.editVariantTitle', {
          name: p.variantSource.name,
          defaultValue: `Размер: ${p.variantSource.name}`,
        })
        : p.t('rst.admin.addVariantTitle', { name: p.variantSource.name })}
      onClose={p.closeVariantForm}
      onSubmit={() => p.saveVariantMutation.mutate()}
      isPending={pending}
      asForm
      size="lg"
      cancelLabel={p.t('common.cancel')}
      submitLabel={editing
        ? p.t('common.save', { defaultValue: 'Сохранить' })
        : p.t('rst.admin.addVariant')}
    >
      <div className="rst-variant-modal">
        <div className="rst-variant-modal__form">
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
          {editing ? (
            <div className="rst-variant-modal__edit-actions">
              <BaseButton type="button" variant="ghost" size="sm" onClick={p.resetVariantEditor} disabled={pending}>
                {p.t('rst.admin.newVariantInstead', { defaultValue: 'Новый размер' })}
              </BaseButton>
            </div>
          ) : null}
        </div>

        <aside className="rst-variant-modal__list" aria-label={p.t('rst.admin.variantListTitle', { defaultValue: 'Размеры' })}>
          <div className="rst-variant-modal__list-head">
            <strong>{p.t('rst.admin.variantListTitle', { defaultValue: 'Размеры' })}</strong>
            <span>{family.length}</span>
          </div>
          {family.length === 0 ? (
            <p className="rst-variant-modal__empty">
              {p.t('rst.admin.variantListEmpty', { defaultValue: 'Пока один базовый размер — добавьте следующий.' })}
            </p>
          ) : (
            <ul className="rst-variant-modal__rows">
              {family.map((row) => {
                const portion = formatMenuPortion(row) || '—';
                const active = p.editingVariantId === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={`rst-variant-modal__row${active ? ' is-active' : ''}`}
                      onClick={() => p.startEditVariant(row)}
                    >
                      <span className="rst-variant-modal__row-portion">{portion}</span>
                      <span className="rst-variant-modal__row-price">{fmtMoneyCompact(row.price)}</span>
                      {row.sku ? (
                        <span className="rst-variant-modal__row-sku">{row.sku}</span>
                      ) : (
                        <span className="rst-variant-modal__row-sku is-muted">—</span>
                      )}
                    </button>
                    <BaseButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rst-variant-modal__row-del"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(p.t('rst.admin.confirmDeactivateVariant', {
                          defaultValue: 'Скрыть этот размер из меню?',
                        }))) {
                          p.deleteVariantMutation.mutate(row.id);
                        }
                      }}
                    >
                      {p.t('common.delete')}
                    </BaseButton>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </RstModal>
  );
}
