import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatMenuPortion } from '../../shared/utils/formatMenuPortion';
import { BaseButton } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';
import '../styles/item-compose-modal.css';

/** Pick one size SKU from a variant family before add-to-order. */
export default function MenuVariantPickModal({ variants, onClose, onPick, t }) {
  const list = variants ?? [];
  if (!list.length) return null;

  const title = list[0]?.name || t('rst.order.pickVariant');

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card rst-item-compose">
        <h2 className="rst-modal__title">{title}</h2>
        <p className="rst-modal__text">{t('rst.order.pickVariantHint')}</p>
        <div className="rst-item-compose__group rst-item-compose__group--size">
          <div className="rst-item-compose__options">
            {list.map((item) => {
              const portion = formatMenuPortion(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  className="rst-item-compose__option rst-item-compose__option--size"
                  onClick={() => onPick(item)}
                >
                  <span>{portion || t('rst.admin.portionUnitPortion')}</span>
                  <em>{fmtMoneyCompact(item.price)}</em>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
        </div>
      </div>
    </RstOverlay>
  );
}

export function groupMenuFamilies(items) {
  const map = new Map();
  for (const item of items ?? []) {
    const key = item.variantGroupId || item.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.values()].map((variants) => {
    const sorted = [...variants].sort((a, b) => {
      const pa = Number(a.portionAmount) || Number(a.portionGrams) || 0;
      const pb = Number(b.portionAmount) || Number(b.portionGrams) || 0;
      if (pa !== pb) return pa - pb;
      return Number(a.price) - Number(b.price);
    });
    const prices = sorted.map((v) => Number(v.price) || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return {
      key: sorted[0].variantGroupId || sorted[0].id,
      variants: sorted,
      primary: sorted[0],
      minPrice,
      maxPrice,
      multi: sorted.length > 1,
    };
  });
}
