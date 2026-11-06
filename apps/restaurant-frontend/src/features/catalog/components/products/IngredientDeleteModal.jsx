import { BaseButton } from '../../../../components/ui';
import '../../styles/ingredient-modal.css';

export default function IngredientDeleteModal({ t, product, onClose, onConfirm }) {
  if (!product) return null;

  return (
    <div className="rst-ingredient-delete">
      <button type="button" className="rst-ingredient-delete__backdrop" aria-label="Close" onClick={onClose} />
      <div className="rst-ingredient-delete__panel" role="dialog" aria-modal="true">
        <h2>{t('products.rowDelete')}</h2>
        <p>{product.name}</p>
        <div className="rst-ingredient-delete__actions">
          <BaseButton type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" variant="danger" onClick={onConfirm}>
            {t('common.delete')}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
